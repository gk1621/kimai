import 'dotenv/config';
import { pool } from "../src/lib/db";
import { readKnowledgeTemplate, seedKnowledgeBase, resetKnowledgeForFirm } from "../src/lib/knowledge";

async function main() {
  const force = process.argv.includes('--force');
  const onlyFirmIndex = process.argv.indexOf('--firm');
  const onlyFirmId = onlyFirmIndex > -1 ? process.argv[onlyFirmIndex + 1] : undefined;

  const tpl = await readKnowledgeTemplate();
  const conn = await pool.getConnection();
  try {
    const firmsWhere = onlyFirmId ? 'WHERE firm_id = ?' : '';
    const [firms]: any = await conn.query(`SELECT firm_id, name FROM firms ${firmsWhere}`, onlyFirmId ? [onlyFirmId] : []);
    for (const f of firms) {
      const firmId: string = f.firm_id;
      const [[row]]: any = await conn.query(`SELECT COUNT(*) AS cnt FROM scenarios WHERE firm_id=?`, [firmId]);
      const has = Number(row?.cnt || 0) > 0;
      if (has && !force) {
        console.log(`Skip ${firmId} (${f.name}) – knowledge already present.`);
        continue;
      }
      if (force) {
        console.log(`Resetting knowledge for ${firmId} (${f.name})...`);
        await resetKnowledgeForFirm(firmId);
      }
      console.log(`Seeding knowledge for ${firmId} (${f.name})...`);
      await seedKnowledgeBase(firmId, tpl);
    }
  } finally {
    conn.release();
  }
  console.log('Knowledge seed complete.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


