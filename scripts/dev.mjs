#!/usr/bin/env node
/**
 * Launcher do Next.js dev com header HTTP grande (1MB).
 *
 * Por que: o cookie de sessão do Auth.js pode ficar grande temporariamente
 * (ex.: foto de perfil em data URL gravada antes do fix). Header default
 * do Node é 16KB — qualquer cookie maior gera HTTP 431 ANTES do middleware
 * rodar, deixando o usuário travado sem conseguir nem acessar /login.
 *
 * Subindo pra 1MB damos espaço pro middleware.ts detectar e limpar o
 * cookie monstro automaticamente. Cross-platform: funciona Windows/Mac/Linux.
 */
import { spawn } from 'node:child_process';

const HEADER_FLAG = '--max-http-header-size=1048576'; // 1 MB

const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, HEADER_FLAG].filter(Boolean).join(' '),
};

const args = process.argv.slice(2);
const command = args[0] ?? 'dev';

const child = spawn('npx', ['next', command, ...args.slice(1)], {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Falha ao iniciar Next.js:', err);
  process.exit(1);
});
