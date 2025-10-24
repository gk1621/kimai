import fs from "fs/promises";
import path from "path";
import { pool } from "./db";

export async function readKnowledgeTemplate(): Promise<any> {
  const filePath = path.resolve(process.cwd(), "data/knowledge_template.json");
  const txt = await fs.readFile(filePath, "utf8");
  return JSON.parse(txt);
}

export async function seedKnowledgeBase(firmId: string, template?: any) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const tpl = template ?? (await readKnowledgeTemplate());

    // global_policies
    let order = 1;
    for (const item of tpl.global_policies?.disclaimer ?? []) {
      await conn.query(
        `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
        [firmId, "disclaimer", item, order++]
      );
    }
    order = 1;
    for (const item of tpl.global_policies?.pii_security ?? []) {
      await conn.query(
        `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
        [firmId, "pii_security", item, order++]
      );
    }
    order = 1;
    for (const item of tpl.global_policies?.triage_priority_rules ?? []) {
      await conn.query(
        `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
        [firmId, "triage_priority_rules", item, order++]
      );
    }
    order = 1;
    for (const item of tpl.global_policies?.handoff_protocol?.criteria ?? []) {
      await conn.query(
        `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
        [firmId, "handoff_criteria", item, order++]
      );
    }
    if (tpl.global_policies?.handoff_protocol?.action) {
      await conn.query(
        `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
        [firmId, "handoff_action", tpl.global_policies.handoff_protocol.action, 0]
      );
    }

    // core_call_flow
    let flowOrder = 1;
    for (const step of tpl.core_call_flow ?? []) {
      await conn.query(
        `INSERT INTO core_call_flow(firm_id, step_id, say, collect, conditional_collect, validate, route_by, choices, display_order)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          firmId,
          step.id,
          step.say ?? null,
          step.collect ? JSON.stringify(step.collect) : null,
          step.conditional_collect ? JSON.stringify(step.conditional_collect) : null,
          step.validate ? JSON.stringify(step.validate) : null,
          step.route_by ?? null,
          step.choices ? JSON.stringify(step.choices) : null,
          flowOrder++,
        ]
      );
    }

    // decision_logic
    await conn.query(
      `INSERT INTO decision_logic(firm_id, signals, sol_calculator, urgency_index, evidence_tags)
       VALUES (?,?,?,?,?)`,
      [
        firmId,
        tpl.decision_logic?.signals ? JSON.stringify(tpl.decision_logic.signals) : null,
        tpl.decision_logic?.sol_calculator ? JSON.stringify(tpl.decision_logic.sol_calculator) : null,
        tpl.decision_logic?.urgency_index ? JSON.stringify(tpl.decision_logic.urgency_index) : null,
        tpl.decision_logic?.evidence_tags ? JSON.stringify(tpl.decision_logic.evidence_tags) : null,
      ]
    );

    // data_model
    await conn.query(
      `INSERT INTO data_model(firm_id, contact_fields, incident_fields, employment_fields, medical_fields, litigation_history_fields, workloss_fields, personal_profile_fields)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        firmId,
        tpl.data_model?.contact_fields ? JSON.stringify(tpl.data_model.contact_fields) : null,
        tpl.data_model?.incident_fields ? JSON.stringify(tpl.data_model.incident_fields) : null,
        tpl.data_model?.employment_fields ? JSON.stringify(tpl.data_model.employment_fields) : null,
        tpl.data_model?.medical_fields ? JSON.stringify(tpl.data_model.medical_fields) : null,
        tpl.data_model?.litigation_history_fields ? JSON.stringify(tpl.data_model.litigation_history_fields) : null,
        tpl.data_model?.workloss_fields ? JSON.stringify(tpl.data_model.workloss_fields) : null,
        tpl.data_model?.personal_profile_fields ? JSON.stringify(tpl.data_model.personal_profile_fields) : null,
      ]
    );

    // sol_rules
    for (const [scenarioName, rules] of Object.entries<any>(tpl.sol_rules ?? {})) {
      await conn.query(
        `INSERT INTO sol_rules(firm_id, scenario_name, rules) VALUES (?,?,?)`,
        [firmId, scenarioName, JSON.stringify(rules)]
      );
    }

    // reject_and_escalation_logic
    for (const entry of tpl.reject_and_escalation_logic ?? []) {
      await conn.query(
        `INSERT INTO reject_and_escalation_logic(firm_id, condition_json, action_text) VALUES (?,?,?)`,
        [firmId, JSON.stringify(entry.if ?? {}), String(entry.then ?? "").trim()]
      );
    }

    // scenarios and scenario_questions
    for (const [scenarioName, scenarioData] of Object.entries<any>(tpl.scenarios ?? {})) {
      const [ins]: any = await conn.query(
        `INSERT INTO scenarios(firm_id, name, statute_of_limitations, data) VALUES (?,?,?,?)`,
        [
          firmId,
          scenarioName,
          scenarioData.statute_of_limitations ?? null,
          JSON.stringify({ ...scenarioData, questions: undefined }),
        ]
      );
      const scenarioId = ins.insertId as number;
      let qOrder = 1;
      for (const q of scenarioData.questions ?? []) {
        await conn.query(
          `INSERT INTO scenario_questions(firm_id, scenario_id, question_text, order_index) VALUES (?,?,?,?)`,
          [firmId, scenarioId, q, qOrder++]
        );
      }
    }

    // scripts
    for (const [key, val] of Object.entries<string>(tpl.scripts ?? {})) {
      await conn.query(
        `INSERT INTO scripts(firm_id, script_key, script_text) VALUES (?,?,?)`,
        [firmId, key, val]
      );
    }

    // output_contract
    await conn.query(
      `INSERT INTO output_contract(firm_id, status, reason_codes, deliverables, natural_language_summary_template)
       VALUES (?,?,?,?,?)`,
      [
        firmId,
        tpl.output_contract?.status ? JSON.stringify(tpl.output_contract.status) : null,
        tpl.output_contract?.reason_codes ? JSON.stringify(tpl.output_contract.reason_codes) : null,
        tpl.output_contract?.deliverables ? JSON.stringify(tpl.output_contract.deliverables) : null,
        tpl.output_contract?.natural_language_summary_template ?? null,
      ]
    );

    // initial knowledge document snapshot
    const initial = {
      version: tpl.version ?? "1.0",
      generated_at: new Date().toISOString(),
      purpose: tpl.purpose ?? null,
      global_policies: tpl.global_policies,
      core_call_flow: tpl.core_call_flow,
      decision_logic: tpl.decision_logic,
      data_model: tpl.data_model,
      sol_rules: tpl.sol_rules,
      reject_and_escalation_logic: tpl.reject_and_escalation_logic,
      scenarios: tpl.scenarios,
      scripts: tpl.scripts,
      output_contract: tpl.output_contract,
    };
    await conn.query(
      `INSERT INTO knowledge_documents(firm_id, version, json) VALUES (?,?,?)`,
      [firmId, Date.now(), JSON.stringify(initial)]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function ensureKnowledgeSeededForFirm(firmId: string) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM scenarios WHERE firm_id=?`, [firmId]);
  const cnt = (rows as any)[0]?.cnt ?? 0;
  if (cnt === 0) {
    const tpl = await readKnowledgeTemplate();
    await seedKnowledgeBase(firmId, tpl);
  }
}

export async function rebuildKnowledgeForFirm(firmId: string): Promise<any> {
  const conn = await pool.getConnection();
  try {
    const [gp]: any = await conn.query(
      `SELECT group_name, item_text FROM global_policies WHERE firm_id=? ORDER BY group_name, display_order, id`,
      [firmId]
    );
    const policies: any = { disclaimer: [], pii_security: [], triage_priority_rules: [], handoff_protocol: { criteria: [], action: "" } };
    for (const r of gp) {
      if (r.group_name === "disclaimer") policies.disclaimer.push(r.item_text);
      else if (r.group_name === "pii_security") policies.pii_security.push(r.item_text);
      else if (r.group_name === "triage_priority_rules") policies.triage_priority_rules.push(r.item_text);
      else if (r.group_name === "handoff_criteria") policies.handoff_protocol.criteria.push(r.item_text);
      else if (r.group_name === "handoff_action") policies.handoff_protocol.action = r.item_text;
    }

    const [flow]: any = await conn.query(
      `SELECT step_id, say, collect, conditional_collect, validate, route_by, choices FROM core_call_flow WHERE firm_id=? ORDER BY display_order, id`,
      [firmId]
    );
    const core_call_flow = flow.map((r: any) => ({
      id: r.step_id,
      ...(r.say ? { say: r.say } : {}),
      ...(r.collect ? { collect: JSON.parse(r.collect) } : {}),
      ...(r.conditional_collect ? { conditional_collect: JSON.parse(r.conditional_collect) } : {}),
      ...(r.validate ? { validate: JSON.parse(r.validate) } : {}),
      ...(r.route_by ? { route_by: r.route_by } : {}),
      ...(r.choices ? { choices: JSON.parse(r.choices) } : {}),
    }));

    const [dlRows]: any = await conn.query(`SELECT * FROM decision_logic WHERE firm_id=? LIMIT 1`, [firmId]);
    const dl = dlRows[0] ?? {};
    const decision_logic = {
      ...(dl.signals ? { signals: JSON.parse(dl.signals) } : {}),
      ...(dl.sol_calculator ? { sol_calculator: JSON.parse(dl.sol_calculator) } : {}),
      ...(dl.urgency_index ? { urgency_index: JSON.parse(dl.urgency_index) } : {}),
      ...(dl.evidence_tags ? { evidence_tags: JSON.parse(dl.evidence_tags) } : {}),
    } as any;

    const [dmRows]: any = await conn.query(`SELECT * FROM data_model WHERE firm_id=? LIMIT 1`, [firmId]);
    const dm = dmRows[0] ?? {};
    const data_model = {
      ...(dm.contact_fields ? { contact_fields: JSON.parse(dm.contact_fields) } : {}),
      ...(dm.incident_fields ? { incident_fields: JSON.parse(dm.incident_fields) } : {}),
      ...(dm.employment_fields ? { employment_fields: JSON.parse(dm.employment_fields) } : {}),
      ...(dm.medical_fields ? { medical_fields: JSON.parse(dm.medical_fields) } : {}),
      ...(dm.litigation_history_fields ? { litigation_history_fields: JSON.parse(dm.litigation_history_fields) } : {}),
      ...(dm.workloss_fields ? { workloss_fields: JSON.parse(dm.workloss_fields) } : {}),
      ...(dm.personal_profile_fields ? { personal_profile_fields: JSON.parse(dm.personal_profile_fields) } : {}),
    } as any;

    const [srRows]: any = await conn.query(`SELECT scenario_name, rules FROM sol_rules WHERE firm_id=? ORDER BY id`, [firmId]);
    const sol_rules: any = {};
    for (const r of srRows) sol_rules[r.scenario_name] = JSON.parse(r.rules);

    const [relRows]: any = await conn.query(`SELECT condition_json, action_text FROM reject_and_escalation_logic WHERE firm_id=? ORDER BY id`, [firmId]);
    const reject_and_escalation_logic = relRows.map((r: any) => ({ if: JSON.parse(r.condition_json), then: r.action_text }));

    const [scRows]: any = await conn.query(`SELECT id, name, statute_of_limitations, data FROM scenarios WHERE firm_id=? ORDER BY name`, [firmId]);
    const scenarios: any = {};
    for (const s of scRows) {
      const [qRows]: any = await conn.query(
        `SELECT question_text FROM scenario_questions WHERE scenario_id=? ORDER BY order_index, id`,
        [s.id]
      );
      const base = s.data ? JSON.parse(s.data) : {};
      if (s.statute_of_limitations) base.statute_of_limitations = s.statute_of_limitations;
      if (qRows.length > 0) base.questions = qRows.map((q: any) => q.question_text);
      scenarios[s.name] = base;
    }

    const [scrRows]: any = await conn.query(`SELECT script_key, script_text FROM scripts WHERE firm_id=? ORDER BY id`, [firmId]);
    const scripts: any = {};
    for (const r of scrRows) scripts[r.script_key] = r.script_text;

    const [ocRows]: any = await conn.query(`SELECT * FROM output_contract WHERE firm_id=? LIMIT 1`, [firmId]);
    const oc = ocRows[0] ?? {};
    const output_contract = {
      ...(oc.status ? { status: JSON.parse(oc.status) } : {}),
      ...(oc.reason_codes ? { reason_codes: JSON.parse(oc.reason_codes) } : {}),
      ...(oc.deliverables ? { deliverables: JSON.parse(oc.deliverables) } : {}),
      ...(oc.natural_language_summary_template ? { natural_language_summary_template: oc.natural_language_summary_template } : {}),
    } as any;

    const tpl = await readKnowledgeTemplate();
    const doc = {
      version: tpl.version ?? "1.0",
      generated_at: new Date().toISOString(),
      purpose: tpl.purpose ?? null,
      global_policies: policies,
      core_call_flow,
      decision_logic,
      data_model,
      sol_rules,
      reject_and_escalation_logic,
      scenarios,
      scripts,
      output_contract,
    };

    // persist snapshot
    await conn.query(
      `INSERT INTO knowledge_documents(firm_id, version, json) VALUES (?,?,?)`,
      [firmId, Date.now(), JSON.stringify(doc)]
    );

    return doc;
  } finally {
    conn.release();
  }
}

export async function resetKnowledgeForFirm(firmId: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM scenario_questions WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM scenarios WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM global_policies WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM core_call_flow WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM decision_logic WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM data_model WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM sol_rules WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM reject_and_escalation_logic WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM scripts WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM output_contract WHERE firm_id=?`, [firmId]);
    await conn.query(`DELETE FROM knowledge_documents WHERE firm_id=?`, [firmId]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}


