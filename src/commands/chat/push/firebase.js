const { Command, flags } = require('@oclif/command');
const { prompt } = require('enquirer');
const chalk = require('chalk');

const { chatAuth } = require('../../../utils/auth/chat-auth');

class PushFirebase extends Command {
	async run() {
		const { flags } = this.parse(PushFirebase);

		try {
			const client = await chatAuth(this);
			if (flags.disable) {
				const result = await prompt({
					type: 'toggle',
					name: 'proceed',
					message:
						'This will disable Firebase push notifications and remove your Firebase Server Key. Are you sure?',
					required: true,
				});
				if (result.proceed) {
					await client.updateAppSettings({
						firebase_config: {
							disabled: true,
						},
					});
					this.log(
						`Push notifications have been ${chalk.red(
							'disabled'
						)} with ${chalk.bold('Firebase')}.`
					);
				}
				this.exit();
			} else if (!flags.key) {
				const res = await prompt([
					{
						type: 'input',
						name: 'key',
						message: `What is your Server key for Firebase?`,
						required: true,
					},
					{
						type: 'input',
						name: 'notification_template',
						hint: 'Omit for Stream default',
						message: `What JSON notification template would you like to use?`,
						required: false,
					},
				]);

				for (const key in res) {
					if (res.hasOwnProperty(key)) {
						flags[key] = res[key];
					}
				}
			}

			const payload = {
				firebase_config: {
					server_key: flags.key,
				},
			};

			if (flags.notification_template) {
				payload.firebase_config.notification_template =
					flags.notification_template;
			}

			await client.updateAppSettings(payload);

			if (flags.json) {
				const settings = await client.getAppSettings();

				this.log(
					JSON.stringify(settings.app.push_notifications.firebase)
				);
				this.exit();
			}

			this.log(
				`Push notifications have been ${chalk.green(
					'enabled'
				)} for ${chalk.bold('Firebase')}.`
			);
			this.exit();
		} catch (error) {
			this.error(error || 'A Stream CLI error has occurred.', {
				exit: 1,
			});
		}
	}
}

PushFirebase.flags = {
	key: flags.string({
		char: 'k',
		description: 'Server key for Firebase.',
		required: false,
	}),
	notification_template: flags.string({
		char: 'n',
		description: 'JSON notification template.',
		required: false,
	}),
	disable: flags.boolean({
		description: 'Disable Firebase push notifications and clear config.',
		required: false,
	}),
	json: flags.boolean({
		char: 'j',
		description:
			'Output results in JSON. When not specified, returns output in a human friendly format.',
		required: false,
	}),
};

module.exports.PushFirebase = PushFirebase;
