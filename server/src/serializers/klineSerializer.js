function kLineSerializer(msg) {
	if (msg) {
		return {
			marketKLine: [
				{
					at: msg[0],
					o: msg[1],
					h: msg[2],
					l: msg[3],
					c: msg[4],
					v: msg[5]
				}
			]
		};
	}
	return { marketKLine: [] };
}

module.exports = kLineSerializer;
