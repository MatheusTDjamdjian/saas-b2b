import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (m) acc[m[1]] = m[2].replace(/^["']|["']$/g, '');
    return acc;
  }, {});

const sql = postgres(env.DATABASE_URL, { prepare: false });

try {
  await sql`DROP TABLE IF EXISTS subscriptions CASCADE`;
  console.log('✓ tabela subscriptions removida');

  await sql`ALTER TABLE tenants DROP COLUMN IF EXISTS stripe_customer_id`;
  console.log('✓ coluna tenants.stripe_customer_id removida');

  await sql`DROP TYPE IF EXISTS sub_status CASCADE`;
  console.log('✓ tipo sub_status removido');

  console.log('\nbanco limpo.');
} catch (err) {
  console.error('ERRO:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
