CREATE TABLE firms (
  firm_id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  timezone VARCHAR(64) DEFAULT 'America/New_York',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  user_id CHAR(36) PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role ENUM('ADMIN','ATTORNEY','INTAKE','PARALEGAL','VIEWER') NOT NULL DEFAULT 'VIEWER',
  password_hash VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);

CREATE TABLE contacts (
  contact_id CHAR(36) PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  best_phone VARCHAR(32),
  email VARCHAR(255),
  mailing_address TEXT,
  dob DATE NULL,
  alt_contact_name VARCHAR(255),
  alt_contact_relation VARCHAR(128),
  alt_contact_phone VARCHAR(32),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  UNIQUE KEY uniq_contact (firm_id, best_phone)
);

CREATE TABLE leads (
  lead_id CHAR(36) PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NOT NULL,
  status ENUM('NEW','SCREENING','QUALIFIED','CONSULT_SCHEDULED','RETAINER_OUT','SIGNED','DECLINED','DEFERRED','CONFLICT') DEFAULT 'NEW',
  scenario ENUM('MOTOR_VEHICLE','MEDICAL','EMPLOYMENT','PREMISES','WORKLOSS','OTHER') NOT NULL,
  urgency_index TINYINT DEFAULT 1,
  urgency_rationale TEXT,
  sol_deadline DATE NULL,
  days_to_sol INT NULL,
  within_sol BOOLEAN DEFAULT TRUE,
  referral_source VARCHAR(255),
  campaign_id VARCHAR(64),
  elevenlabs_call_id VARCHAR(128),
  idempotency_key VARCHAR(128),
  assignee_user_id CHAR(36) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  FOREIGN KEY (contact_id) REFERENCES contacts(contact_id),
  FOREIGN KEY (assignee_user_id) REFERENCES users(user_id),
  UNIQUE KEY uniq_idem (firm_id, idempotency_key)
);

CREATE TABLE incidents (
  incident_id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  date_of_incident DATE,
  location VARCHAR(255),
  description TEXT,
  injuries TEXT,
  providers JSON,
  police_report VARCHAR(64),
  witnesses JSON,
  photos_or_video BOOLEAN,
  defendant_info JSON,
  insurance_info JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
);

CREATE TABLE scenario_medical (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  initial_reason_for_care TEXT,
  onset_of_problem DATE NULL,
  first_discussion_with_provider DATE NULL,
  alleged_error_description TEXT,
  providers_named JSON,
  opinions_of_error_by_others JSON,
  records_possession BOOLEAN,
  date_of_discovery_optional DATE NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
);

CREATE TABLE scenario_employment (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  employer_name VARCHAR(255),
  employer_address TEXT,
  employee_count INT,
  hire_date DATE,
  end_date DATE,
  job_title VARCHAR(255),
  pay_structure ENUM('SALARY','HOURLY','COMMISSION','OTHER'),
  benefits JSON,
  personnel_file_possession BOOLEAN,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
);

CREATE TABLE transcripts (
  transcript_id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  raw_text LONGTEXT,
  structured_json JSON,
  checksum VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id)
);

CREATE TABLE tasks (
  task_id CHAR(36) PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  lead_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  due_at DATETIME,
  assignee_user_id CHAR(36),
  status ENUM('OPEN','IN_PROGRESS','DONE','CANCELLED') DEFAULT 'OPEN',
  sla_flag BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
  FOREIGN KEY (assignee_user_id) REFERENCES users(user_id)
);

CREATE TABLE audit_events (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  actor_user_id CHAR(36),
  entity_type VARCHAR(64),
  entity_id CHAR(36),
  action VARCHAR(64),
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (firm_id, created_at)
);


