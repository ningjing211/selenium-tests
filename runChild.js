// Not working

const { exec } = require('child_process');

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Starting ${scriptPath}`);
    const process = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script ${scriptPath}:`, error);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error output from script ${scriptPath}:`, stderr);
      }
      console.log(`Output from script ${scriptPath}:`, stdout);
      resolve();
    });

    process.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  try {
    await runScript('./registerAndBuy.js');
    await runScript('./admin.js');
    // await runScript('./existedMemberPurchase.js');
    // await runScript('./getMemberShare.js');
    console.log('All scripts executed successfully');
  } catch (error) {
    console.error('Error during script execution:', error);
  }
}

main();
