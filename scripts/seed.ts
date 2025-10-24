import 'dotenv/config';
import { pool } from "../src/lib/db";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { seedKnowledgeBase, readKnowledgeTemplate } from "../src/lib/knowledge";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create 5 firms
    const firmIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const id = randomUUID();
      firmIds.push(id);
      await conn.query(`INSERT INTO firms(firm_id, name) VALUES(?, ?)`, [id, `Firm ${i}`]);
    }

    // Create one admin user per firm
    for (const firmId of firmIds) {
      const uid = randomUUID();
      const pwd = await hash("Password123!", 10);
      await conn.query(
        `INSERT INTO users(user_id, firm_id, email, name, role, password_hash) VALUES(?, ?, ?, ?, 'ADMIN', ?)`,
        [uid, firmId, `admin+${firmId.slice(0, 6)}@kimai.local`, `Admin ${firmId.slice(0, 4)}`, pwd]
      );
    }

    const scenarios = ["MOTOR_VEHICLE","MEDICAL","EMPLOYMENT","PREMISES","WORKLOSS","OTHER"] as const;
    const statuses = ["NEW","SCREENING","QUALIFIED","CONSULT_SCHEDULED","RETAINER_OUT","SIGNED","DECLINED","DEFERRED","CONFLICT"] as const;

    // For each firm: seed knowledge template, then create 20 contacts + leads
    const tpl = await readKnowledgeTemplate();
    for (const firmId of firmIds) {
      await seedKnowledgeBase(firmId, tpl);
      for (let i = 1; i <= 20; i++) {
        const contactId = randomUUID();
        const phone = `+1555${Math.floor(1000000 + Math.random() * 8999999)}`;
        await conn.query(
          `INSERT INTO contacts(contact_id, firm_id, full_name, best_phone, email) VALUES(?, ?, ?, ?, ?)`,
          [contactId, firmId, `Contact ${i}`, phone, `c${i}@example.com`]
        );
        const leadId = randomUUID();
        await conn.query(
          `INSERT INTO leads(lead_id, firm_id, contact_id, status, scenario, urgency_index)
           VALUES(?, ?, ?, ?, ?, ?)`,
          [leadId, firmId, contactId, pick(statuses), pick(scenarios), 1 + Math.floor(Math.random() * 5)]
        );
      }
    }

    await conn.commit();
    console.log("Seed complete.");
  } catch (e) {
    await conn.rollback();
    console.error(e);
    process.exit(1);
  } finally {
    conn.release();
  }
}

main().then(() => process.exit(0));


