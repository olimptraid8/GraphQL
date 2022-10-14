const loggerStatus = [ 'INFO', 'ERROR' ];

const logger = (status, info) => {
	if (loggerStatus.includes(status)) {
		if (Array.isArray(info)) {
			info.map((el) => {
				console.log(`${new Date().toISOString()} - ${status} | ${JSON.stringify(el)}`);
			});
		} else {
			console.log(`${new Date().toISOString()} - ${status} | ${JSON.stringify(info)}`);
		}
	}
};

module.exports = logger;
