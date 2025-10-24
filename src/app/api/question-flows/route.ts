import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { rebuildKnowledgeForFirm } from "@/lib/knowledge";

type FlowNode = {
  id: string;
  type: string;
  data: { label: string; conditions?: any; required?: boolean; validation_rules?: any };
  position?: { x: number; y: number };
};
type FlowEdge = {
  id: string;
  source: string;
  target: string;
  data?: { condition_expression?: string; priority?: number; metadata?: any };
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firm_id, practice_area, nodes, edges, version, case_type_code, case_type_name } = body || {};
  if (!firm_id || !practice_area || !Array.isArray(nodes) || !Array.isArray(edges)) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [paRows]: any = await conn.query(
      `SELECT id FROM practice_areas WHERE firm_id=? AND name=? LIMIT 1`,
      [firm_id, practice_area]
    );
    let practice_area_id = paRows[0]?.id;
    if (!practice_area_id) {
      const [result]: any = await conn.query(
        `INSERT INTO practice_areas(firm_id, name, description) VALUES (?, ?, ?)`,
        [firm_id, practice_area, null]
      );
      practice_area_id = result.insertId;
    }

    let case_type_id: number | null = null;
    if (case_type_name || case_type_code) {
      const [ctRows]: any = await conn.query(
        `SELECT id FROM case_types WHERE code=? OR (practice_area_id=? AND name=?) LIMIT 1`,
        [case_type_code ?? null, practice_area_id, case_type_name ?? null]
      );
      if (ctRows[0]?.id) {
        case_type_id = ctRows[0].id;
      } else {
        const [ins]: any = await conn.query(
          `INSERT INTO case_types(practice_area_id, name, code) VALUES (?, ?, ?)`,
          [practice_area_id, case_type_name ?? practice_area + " Case", case_type_code ?? null]
        );
        case_type_id = ins.insertId;
      }
    }

    const nodeIdToQuestionId = new Map<string, number>();
    let display_order = 1;
    for (const n of nodes as FlowNode[]) {
      const [ins]: any = await conn.query(
        `INSERT INTO question_templates(case_type_id, firm_id, question_text, question_type, display_order, conditions, validation_rules, version, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          case_type_id ?? null,
          firm_id,
          n.data?.label ?? "",
          n.type === "question" ? "required" : "follow_up",
          display_order++,
          n.data?.conditions ? JSON.stringify(n.data.conditions) : null,
          n.data?.validation_rules ? JSON.stringify(n.data.validation_rules) : null,
          version ?? 1,
        ]
      );
      nodeIdToQuestionId.set(n.id, ins.insertId);
    }

    for (const e of edges as FlowEdge[]) {
      const fromId = nodeIdToQuestionId.get(e.source);
      const toId = nodeIdToQuestionId.get(e.target);
      if (!fromId || !toId) continue;
      await conn.query(
        `INSERT INTO question_flow_rules(firm_id, from_question_id, condition_expression, next_question_id, priority, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          body.firm_id,
          fromId,
          e.data?.condition_expression ?? null,
          toId,
          e.data?.priority ?? 0,
          e.data?.metadata ? JSON.stringify(e.data.metadata) : null,
        ]
      );
    }

    await conn.commit();
    // trigger rebuild
    rebuildKnowledgeForFirm(body.firm_id).catch(() => {});
    return NextResponse.json({ status: "ok", practice_area_id, case_type_id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: "DB_ERROR", detail: (e as Error).message }, { status: 500 });
  } finally {
    conn.release();
  }
}


