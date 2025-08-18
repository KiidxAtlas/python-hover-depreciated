import { spawn } from 'child_process';

export function spawnHelper() {
    const pythonProcess = spawn('python', ['-u', './python/helper.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Helper Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Helper Error: ${data}`);
    });

    return pythonProcess;
}
