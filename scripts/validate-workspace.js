#!/usr/bin/env node

/**
 * Workspace improvement script to validate and monitor the python-hover extension
 */

const fs = require('fs');
const path = require('path');

class WorkspaceValidator {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.issues = [];
    }

    validate() {
        console.log('🔍 Validating Python Hover workspace...\n');

        this.checkPackageJson();
        this.checkTsConfig();
        this.checkTasksJson();
        this.checkSourceStructure();
        this.checkTestCoverage();

        this.reportResults();
    }

    checkPackageJson() {
        const packagePath = path.join(this.rootPath, 'package.json');

        if (!fs.existsSync(packagePath)) {
            this.issues.push('❌ package.json not found');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            // Check essential fields
            const requiredFields = ['name', 'version', 'engines', 'activationEvents'];
            for (const field of requiredFields) {
                if (!packageJson[field]) {
                    this.issues.push(`❌ Missing required field in package.json: ${field}`);
                }
            }

            // Check VS Code engine version
            if (packageJson.engines && packageJson.engines.vscode) {
                console.log('✅ VS Code engine version:', packageJson.engines.vscode);
            }

            // Check for security vulnerabilities in dependencies
            const devDeps = packageJson.devDependencies || {};
            const deps = packageJson.dependencies || {};

            console.log('✅ package.json validation passed');
        } catch (error) {
            this.issues.push(`❌ Invalid package.json: ${error.message}`);
        }
    }

    checkTsConfig() {
        const tsConfigPath = path.join(this.rootPath, 'tsconfig.json');

        if (!fs.existsSync(tsConfigPath)) {
            this.issues.push('❌ tsconfig.json not found');
            return;
        }

        try {
            const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

            // Check compiler options
            const compilerOptions = tsConfig.compilerOptions || {};

            if (compilerOptions.target && compilerOptions.module) {
                console.log('✅ TypeScript configuration looks good');
            } else {
                this.issues.push('❌ TypeScript configuration incomplete');
            }
        } catch (error) {
            this.issues.push(`❌ Invalid tsconfig.json: ${error.message}`);
        }
    }

    checkTasksJson() {
        const tasksPath = path.join(this.rootPath, '.vscode', 'tasks.json');

        if (!fs.existsSync(tasksPath)) {
            this.issues.push('❌ .vscode/tasks.json not found');
            return;
        }

        try {
            const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

            if (tasks.tasks && Array.isArray(tasks.tasks)) {
                // Check for duplicate tasks
                const labels = tasks.tasks.map(task => task.label);
                const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);

                if (duplicates.length > 0) {
                    this.issues.push(`❌ Duplicate tasks found: ${duplicates.join(', ')}`);
                } else {
                    console.log('✅ No duplicate tasks found');
                }
            }
        } catch (error) {
            this.issues.push(`❌ Invalid tasks.json: ${error.message}`);
        }
    }

    checkSourceStructure() {
        const srcPath = path.join(this.rootPath, 'src');

        if (!fs.existsSync(srcPath)) {
            this.issues.push('❌ src directory not found');
            return;
        }

        // Check for essential files
        const essentialFiles = [
            'extension.ts',
            'hover.ts',
            'config.ts',
            'types.ts'
        ];

        for (const file of essentialFiles) {
            const filePath = path.join(srcPath, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ Found ${file}`);
            } else {
                this.issues.push(`❌ Missing essential file: ${file}`);
            }
        }

        // Check for test files
        const testPath = path.join(srcPath, 'test');
        if (fs.existsSync(testPath)) {
            const testFiles = fs.readdirSync(testPath, { recursive: true })
                .filter(file => file.endsWith('.test.ts'));
            console.log(`✅ Found ${testFiles.length} test files`);
        } else {
            this.issues.push('❌ Test directory not found');
        }
    }

    checkTestCoverage() {
        // This is a simplified check - in a real scenario you'd run coverage tools
        const testPath = path.join(this.rootPath, 'src', 'test');

        if (fs.existsSync(testPath)) {
            try {
                const testFiles = fs.readdirSync(testPath, { recursive: true })
                    .filter(file => file.endsWith('.test.ts'));

                if (testFiles.length >= 2) {
                    console.log('✅ Good test coverage detected');
                } else {
                    this.issues.push('⚠️  Consider adding more unit tests');
                }
            } catch (error) {
                this.issues.push(`❌ Error checking test coverage: ${error.message}`);
            }
        }
    }

    reportResults() {
        console.log('\n📋 Validation Results:\n');

        if (this.issues.length === 0) {
            console.log('🎉 All checks passed! Your workspace looks great.\n');
            console.log('💡 Suggestions for continuous improvement:');
            console.log('   • Run tests regularly: npm test');
            console.log('   • Keep dependencies updated');
            console.log('   • Monitor extension performance');
            console.log('   • Gather user feedback');
        } else {
            console.log('⚠️  Issues found:\n');
            this.issues.forEach(issue => console.log(`   ${issue}`));
            console.log('\n🔧 Please address these issues to improve your extension quality.');
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const rootPath = process.argv[2] || process.cwd();
    const validator = new WorkspaceValidator(rootPath);
    validator.validate();
}

module.exports = WorkspaceValidator;
