<?php
header('Content-Type: application/json');

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$parts = explode(' ', $auth);
$token = count($parts) === 2 ? trim($parts[1]) : '';
if ($token !== getenv('ELEVENLABS_WEBHOOK_TOKEN')) { http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit; }

$body = file_get_contents('php://input');
$payload = json_decode($body, true);
if (!$payload) { http_response_code(400); echo json_encode(['error'=>'Invalid JSON']); exit; }

$mysqli = new mysqli(getenv('DB_HOST'), getenv('DB_USER'), getenv('DB_PASS'), getenv('DB_NAME'));
if ($mysqli->connect_error) { http_response_code(500); echo json_encode(['error'=>'DB_CONNECT_FAIL']); exit; }

$mysqli->begin_transaction();
try {
  $firm_id = $payload['firm_id'];
  $contact = $payload['contact'];
  $scenario = $payload['scenario'];
  $incident = isset($payload['incident']) ? $payload['incident'] : null;
  $transcript = isset($payload['transcript']) ? $payload['transcript'] : null;
  $idempotency_key = isset($_SERVER['HTTP_IDEMPOTENCY_KEY']) ? $_SERVER['HTTP_IDEMPOTENCY_KEY'] : (isset($payload['call_id']) ? $payload['call_id'] : null);

  // Upsert contact by (firm_id, best_phone)
  $stmt = $mysqli->prepare("INSERT INTO contacts(contact_id, firm_id, full_name, best_phone, email, mailing_address, dob) VALUES(UUID(), ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), best_phone=VALUES(best_phone), email=VALUES(email), mailing_address=VALUES(mailing_address), dob=VALUES(dob)");
  $dob = isset($contact['dob']) ? $contact['dob'] : null;
  $email = isset($contact['email']) ? $contact['email'] : null;
  $addr = isset($contact['mailing_address']) ? $contact['mailing_address'] : null;
  $stmt->bind_param("ssssss", $firm_id, $contact['full_name'], $contact['best_phone'], $email, $addr, $dob);
  $stmt->execute();
  $stmt->close();

  $stmt = $mysqli->prepare("SELECT contact_id FROM contacts WHERE firm_id=? AND best_phone=? ORDER BY created_at DESC LIMIT 1");
  $stmt->bind_param("ss", $firm_id, $contact['best_phone']);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();
  $contact_id = $row['contact_id'];
  $stmt->close();

  // Compute simple SOL (3 years) and urgency (naive)
  $sol_date = isset($payload['sol_date']) ? $payload['sol_date'] : null;
  if (!$sol_date && isset($incident['date'])) {
    $base = new DateTime($incident['date']);
    $base->modify('+3 years');
    $sol_date = $base->format('Y-m-d');
  }

  $days_to_sol = null; $within_sol = 1;
  if ($sol_date) {
    $d1 = new DateTime(); $d2 = new DateTime($sol_date);
    $diff = $d1->diff($d2);
    $days_to_sol = (int)$diff->format('%r%a');
    $within_sol = $days_to_sol >= 0 ? 1 : 0;
  }
  $urgency_index = isset($payload['urgency_hint']) ? max(1, min(5, (int)$payload['urgency_hint'])) : 1;

  // Insert IGNORE lead
  $stmt = $mysqli->prepare("INSERT IGNORE INTO leads(lead_id, firm_id, contact_id, status, scenario, urgency_index, sol_deadline, days_to_sol, within_sol, referral_source, elevenlabs_call_id, idempotency_key) VALUES(UUID(), ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?, ?)");
  $ref = isset($payload['referral_source']) ? $payload['referral_source'] : null;
  $call_id = isset($payload['call_id']) ? $payload['call_id'] : null;
  $stmt->bind_param("ssssisssss", $firm_id, $contact_id, $scenario, $urgency_index, $sol_date, $days_to_sol, $within_sol, $ref, $call_id, $idempotency_key);
  $stmt->execute();
  $stmt->close();

  $stmt = $mysqli->prepare("SELECT lead_id FROM leads WHERE firm_id=? AND contact_id=? ORDER BY created_at DESC LIMIT 1");
  $stmt->bind_param("ss", $firm_id, $contact_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();
  $lead_id = $row['lead_id'];
  $stmt->close();

  // Incident
  if ($incident) {
    $stmt = $mysqli->prepare("INSERT INTO incidents(incident_id, lead_id, date_of_incident, location, description, injuries, providers, police_report, witnesses, photos_or_video, defendant_info, insurance_info) VALUES(UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $providers = json_encode(isset($incident['providers']) ? $incident['providers'] : []);
    $witnesses = json_encode(isset($incident['witnesses']) ? $incident['witnesses'] : []);
    $def = json_encode(isset($incident['defendant_info']) ? $incident['defendant_info'] : new stdClass());
    $ins = json_encode(isset($incident['insurance_info']) ? $incident['insurance_info'] : new stdClass());
    $photos = isset($incident['photos_or_video']) && $incident['photos_or_video'] ? 1 : 0;
    $police = isset($incident['police_report']) ? (is_bool($incident['police_report']) ? ($incident['police_report'] ? '1' : '0') : $incident['police_report']) : null;
    $stmt->bind_param("ssssssssiss", $lead_id, $incident['date'], $incident['location'], $incident['description'], $incident['injuries'], $providers, $police, $witnesses, $photos, $def, $ins);
    $stmt->execute();
    $stmt->close();
  }

  if ($transcript) {
    $raw = isset($transcript['raw']) ? $transcript['raw'] : '';
    $structured = json_encode(isset($transcript['structured']) ? $transcript['structured'] : new stdClass());
    $checksum = hash('sha256', $raw . $structured);
    $stmt = $mysqli->prepare("INSERT INTO transcripts(transcript_id, lead_id, raw_text, structured_json, checksum) VALUES(UUID(), ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $lead_id, $raw, $structured, $checksum);
    $stmt->execute();
    $stmt->close();
  }

  $mysqli->commit();
  echo json_encode(['status'=>'ok', 'lead_id'=>$lead_id]);
} catch (Exception $e) {
  $mysqli->rollback();
  http_response_code(500);
  echo json_encode(['error'=>'DB_ERROR']);
}



