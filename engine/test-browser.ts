import { browserManager } from './browser-manager';

async function main() {
  console.log('[Browser Test] Testing Chrome / Edge persistent session connection...');
  const result = await browserManager.testSessionStatus({ headless: true });

  console.log('\n--- Connection Result ---');
  console.log(`Connected:        ${result.connected}`);
  console.log(`Connection Type:  ${result.isCdp ? 'CDP (Chrome DevTools Protocol)' : 'Local Persistent Context'}`);
  console.log(`LinkedIn Session: ${result.linkedinLogged ? 'Logged In' : 'Not detected / Need login'}`);
  console.log(`Naukri Session:   ${result.naukriLogged ? 'Logged In' : 'Not detected / Need login'}`);
  console.log(`Message:          ${result.message}`);

  await browserManager.close();
  process.exit(0);
}

main().catch(err => {
  console.error('[Error testing browser]', err);
  process.exit(1);
});
