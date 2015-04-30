var generators = require('yeoman-generator');
var changeCase = require('change-case');
var fs         = require('fs');
var chalk      = require('chalk');

module.exports = generators.Base.extend({
  initializing: function() {
    this.root     = fs.readdirSync(this.destinationRoot());
    this.files    = this.fs.readJSON(this.sourceRoot() + '/files.json');
    this.emptydir = true;

    if (this.root.length > 0) { this.emptydir = false; }
  },

  prompting: function() {
    var complete = this.async();
    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'Components name:',
      default: changeCase.paramCase(this.appname)
    }];

    if (!this.emptydir) {
      prompts.push({
        type: 'confirm',
        name: 'newdir',
        message: 'This directory isn\'t empty, do you want me to create a project directory for you?'
      });
    } else {
      prompts.push({
        type: 'confirm',
        name: 'isroot',
        message: 'Is this the project folder?'
      });
    }

    //run prompts to user
    this.prompt(prompts, function(prompt, error) {
      if (error) {
        return this.log('Ooops, there has been an error:', error);
      }

      if (!prompt.isroot) {
        prompt.newdir = true;
      }

      this.newdir = prompt.newdir;
      this.name   = changeCase.paramCase(prompt.name);
      if (prompt.name === undefined) {
        this.name = changeCase.paramCase(changeCase.paramCase(this.appname));
      }

      complete();

    }.bind(this));
  },

  writing: function() {
    var basefilename = this.name.split('-');

    //Let's format the component name to our needs
    this.title          = changeCase.sentenceCase(this.name).slice(4);
    this.title          = changeCase.upperCaseFirst(this.title);
    this.camelname      = changeCase.camelCase(this.name);
    this.directive      = this.name + '-directive';
    this.cameldirective = changeCase.camelCase(this.directive);
    this.directiveFile  = basefilename[1] + '.js';
    this.templateFile   = basefilename[1] + '.html';

    //if we need a new directory, set path
    this.projectdir     = '';
    if (this.newdir) {
      this.projectdir = this.name + '/';
    }

    this.fs.copy(
      this.templatePath('base'),
      this.destinationPath(this.projectdir)
    );

    this.files.forEach(function(entry) {
      var destination = entry;
      destination     = destination.replace('seed.js', this.directiveFile);
      destination     = destination.replace('seed.html', this.templateFile);

      this.fs.copyTpl(
        this.templatePath('files/' + entry),
        this.destinationPath(this.projectdir + destination), {
          componentTitle: this.title,
          componentName: this.name,
          componentCamelName: this.camelname,
          componentDirective: this.directive,
          componentCamelDirective: this.cameldirective,
          directiveFile: this.directiveFile,
          templateFile: this.templateFile
        }
      );
    }.bind(this));

  },

  install: function() {
    if (this.newdir) {
      try { process.chdir(this.projectdir); }
      catch (error) { return this.log('Ooops, there has been an error:', error); }
    }

    this.log('\nI\'m just running ' + chalk.bold.yellow('npm install') +
             ' for you, if this fails try running the command yourself.\n');

    this.npmInstall();
  },

  end: function() {
    this.log(chalk.bold.green('\nI\'m all done! Have a great day.'));
  }

});
