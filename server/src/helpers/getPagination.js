function paginationFromHeader(headers) {
	const result = {};
	headers.forEach(function(val, key) {
		switch (key) {
			case 'page':
				result.page = val;
				break;
			case 'per-page':
				result.perPage = val;
				break;
			case 'total':
				result.total = val;
				break;
			default:
				break;
		}
	});
	return result;
}

module.exports = paginationFromHeader;
