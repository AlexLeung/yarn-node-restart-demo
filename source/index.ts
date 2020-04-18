import * as os from 'os';
import * as child_process from 'child_process';

const command = "tsc -b --watch --preserveWatchOutput"; // approach one: Second process observes EONENT
//const command = "yarn tsc -b --watch --preserveWatchOutput"; // approach two: Child isn't killed, leading to infinite detached children

console.log("own PID = " + process.pid);

const [executableName, ...commandArgs] = command.split(" ");
const child = child_process.spawn(
    spawnName(executableName), commandArgs,
    {stdio: 'inherit', cwd: process.cwd() });

child.on('error', err => {
    console.log(err);
});

console.log("child PID = " + child.pid);

const TEN_SECONDS = 10000;
setTimeout(() => {
    console.log("10 seconds passed.");
    kill(child, () => {
        console.log("Killed child.");
        process.on("exit", function () {
            console.log("Restarting.");
            const [ownExecName, ...ownArgs] = process.argv;
            child_process.spawn(ownExecName, ownArgs, {
                cwd: process.cwd(),
                detached: true,
                stdio: "inherit"
            });
        });
        process.exit();
    });
}, TEN_SECONDS);


const OS_IS_WINDOWS = os.platform() === 'win32';

function spawnName(commandName: string) {
    return `${commandName}${OS_IS_WINDOWS ? '.cmd' : ''}`;
}

function kill(child: child_process.ChildProcess, cb: () => void) {
    child.on('exit', cb);
    if(OS_IS_WINDOWS) {
        child_process.execSync("taskkill /F /T /pid " + child.pid);
    } else {
        child.kill("SIGTERM");
    }
}