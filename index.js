const { Command } = require('commander');
const program = new Command();

program
  .name('bc2024-4')
  .description('CLI application with Commander.js and SuperAgent')
  .version('1.0.0');

program.command('hello')
  .description('Prints hello message')
  .action(() => {
    console.log('Hello from bc2024-4!');
  });

program.parse(process.argv);
