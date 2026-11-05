import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import net from 'net';

// Automatically start JSON Server on port 5000 when "npm run dev" is executed
function autoStartJsonServerPlugin() {
  let serverStarted = false;

  return {
    name: 'auto-start-json-server',
    configureServer() {
      if (serverStarted) return;
      serverStarted = true;

      const tester = net.createServer();
      tester.once('error', () => {
        // Port 5000 is already in use by JSON Server
      });
      tester.once('listening', () => {
        tester.close(() => {
          const child = spawn(
            'npx',
            ['json-server', '--watch', 'db.json', '--port', '5000'],
            {
              shell: true,
              stdio: 'ignore',
              detached: false
            }
          );
          child.unref();
        });
      });
      tester.listen(5000);
    }
  };
}

export default defineConfig({
  plugins: [react(), autoStartJsonServerPlugin()],
  server: {
    port: 5173,
    open: false
  }
});
