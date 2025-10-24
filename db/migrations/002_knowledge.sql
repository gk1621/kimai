CREATE TABLE practice_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_practice_area (firm_id, name),
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);

CREATE TABLE case_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  practice_area_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  priority_score INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (practice_area_id) REFERENCES practice_areas(id)
);

CREATE TABLE question_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_type_id INT,
  firm_id CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('required','conditional','follow_up') DEFAULT 'required',
  display_order INT,
  conditions JSON,
  validation_rules JSON,
  created_by CHAR(36),
  version INT DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_type_id) REFERENCES case_types(id),
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_qt_firm_case (firm_id, case_type_id)
);

CREATE TABLE question_flow_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  from_question_id INT NOT NULL,
  condition_expression TEXT,
  next_question_id INT NOT NULL,
  priority INT DEFAULT 0,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_question_id) REFERENCES question_templates(id),
  FOREIGN KEY (next_question_id) REFERENCES question_templates(id),
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_qfr_from (from_question_id, priority)
);

CREATE TABLE intake_sessions (
  id CHAR(36) PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  case_type_id INT,
  caller_phone VARCHAR(32),
  session_data JSON,
  current_question_id INT,
  status ENUM('active','completed','abandoned') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (case_type_id) REFERENCES case_types(id),
  FOREIGN KEY (current_question_id) REFERENCES question_templates(id),
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_sessions_firm_status (firm_id, status, created_at)
);

CREATE TABLE firm_settings (
  firm_id CHAR(36) PRIMARY KEY,
  elevenlabs JSON,
  twilio JSON,
  agent JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);


