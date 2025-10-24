CREATE TABLE global_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  group_name VARCHAR(64) NOT NULL,
  item_text TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_gp_firm_group (firm_id, group_name, display_order)
);

CREATE TABLE core_call_flow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  step_id VARCHAR(64) NOT NULL,
  say TEXT,
  collect JSON,
  conditional_collect JSON,
  validate JSON,
  route_by VARCHAR(64),
  choices JSON,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  UNIQUE KEY uniq_flow_step (firm_id, step_id)
);

CREATE TABLE decision_logic (
  firm_id CHAR(36) PRIMARY KEY,
  signals JSON,
  sol_calculator JSON,
  urgency_index JSON,
  evidence_tags JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);

CREATE TABLE data_model (
  firm_id CHAR(36) PRIMARY KEY,
  contact_fields JSON,
  incident_fields JSON,
  employment_fields JSON,
  medical_fields JSON,
  litigation_history_fields JSON,
  workloss_fields JSON,
  personal_profile_fields JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);

CREATE TABLE sol_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  scenario_name VARCHAR(150) NOT NULL,
  rules JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  UNIQUE KEY uniq_sol_rules (firm_id, scenario_name)
);

CREATE TABLE reject_and_escalation_logic (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  condition_json JSON NOT NULL,
  action_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_rel_firm (firm_id)
);

CREATE TABLE scenarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  statute_of_limitations TEXT,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  UNIQUE KEY uniq_scenario (firm_id, name)
);

CREATE TABLE scenario_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  scenario_id INT NOT NULL,
  question_text TEXT NOT NULL,
  order_index INT DEFAULT 0,
  condition_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_sq_scenario (scenario_id, order_index)
);

CREATE TABLE scripts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  script_key VARCHAR(64) NOT NULL,
  script_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  UNIQUE KEY uniq_script (firm_id, script_key)
);

CREATE TABLE output_contract (
  firm_id CHAR(36) PRIMARY KEY,
  status JSON,
  reason_codes JSON,
  deliverables JSON,
  natural_language_summary_template TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id)
);

CREATE TABLE knowledge_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  firm_id CHAR(36) NOT NULL,
  version BIGINT NOT NULL,
  json LONGTEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(firm_id),
  INDEX idx_kdoc_firm_time (firm_id, generated_at)
);


