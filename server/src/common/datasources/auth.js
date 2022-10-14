const fetch = require('node-fetch');
const tmp = require('tmp');
const fs = require('fs');
const { RESTDataSource } = require('apollo-datasource-rest');
const FormData = require('form-data');
const config = require('../../../config.json');
const { ok } = require('assert');

class AuthAPI extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = config.barongURL;
		this.baseInternalURL = config.barongInternalURL || 'http://barong:8001/api/v2/';
	}

	getUrlHeaders(_barong_session, headers) {
		let baseURL = headers && headers.authorization ? this.baseInternalURL : this.baseURL;

		let reqHeaders =
			headers && headers.authorization
				? { authorization: headers.authorization }
				: {
						'Content-Type': 'application/json;charset=utf-8',
						'User-Agent': 'Exchange/proxy',
						Cookie: `_barong_session=${_barong_session}`
					};
		return { baseURL, reqHeaders };
	}

	async confirmEmail({ token, lang }) {
		const response = await fetch(`${this.baseURL}identity/users/email/confirm_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({
				token,
				lang
			})
		});
		if (response.status === 201) {
			return {};
		} else {
			return { errors: [ '' ], status: response.status };
		}
	}

	async resetPassword({ reset_password_token, password, confirm_password, lang }) {
		const response = await fetch(`${this.baseURL}identity/users/password/confirm_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({
				reset_password_token,
				password,
				confirm_password,
				lang
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async askResetPassword({ email, lang }) {
		const response = await fetch(`${this.baseURL}identity/users/password/generate_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({
				email,
				lang
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async askEmailConfirm({ email, lang }) {
		const response = await fetch(`${this.baseURL}identity/users/email/generate_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({
				email,
				lang
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async createUser({ email, password, refid, captcha_response, data, lang }) {
		const response = await fetch(`${this.baseURL}identity/users`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({ email, password, refid, captcha_response, data, lang })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async askQRCodeOTP({ _barong_session }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);

		const response = await fetch(`${baseURL}resource/otp/generate_qrcode`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async enableOTP({ _barong_session, code }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/otp/enable`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ code })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async disableOTP({ _barong_session, code }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/otp/disable`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ code })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async addPhone({ _barong_session, phone_number }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/phones`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ phone_number })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async askPhoneCode({ _barong_session, phone_number }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/phones/send_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ phone_number })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async verifyPhone({ _barong_session, phone_number, verification_code }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/phones/verify`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({ phone_number, verification_code })
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}

		if (response.status !== 200 && response.status !== 201) {
			return { errors: [ 'error' ], status: response.status };
		}
		return result;
	}

	async saveProfile(
		{ _barong_session, first_name, last_name, dob, address, postcode, city, country, metadata, confirm },
		headers
	) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const getProfile = await fetch(`${baseURL}resource/profiles/me`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const oldProfile = await getProfile.json();
		// console.log('Agent', config, config.userAgent)
		const method = oldProfile && !oldProfile.errors && oldProfile.length > 0 ? 'PUT' : 'POST';
		const profile = { first_name, last_name, dob, address, postcode, city, country, metadata };
		if (typeof confirm !== 'boolean' || confirm) {
			profile.confirm = true;
		}
		const response = await fetch(`${this.baseURL}resource/profiles`, {
			method,
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify(profile)
		});
		const result = await response.json();
		// console.log('SAVE PROFILE', result);
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async getPhones({ _barong_session }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/phones`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		// console.log('get PHONE', reqHeaders);
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async getApiKeys({ _barong_session }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/api_keys`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async resetPassword({ reset_password_token, password, confirm_password, lang }) {
		const response = await fetch(`${this.baseURL}identity/users/password/confirm_code`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: {
				'User-Agent': 'Exchange/proxy',
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({
				reset_password_token,
				password,
				confirm_password,
				lang
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async changePassword({ _barong_session, old_password, new_password, confirm_password }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/users/password`, {
			method: 'PUT',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				old_password,
				new_password,
				confirm_password
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async createApiKey({ _barong_session, otp }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/api_keys`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				algorithm: 'HS256',
				totp_code: otp
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return {
			...result,
			secret: result.secret.data.value
		};
	}

	async deleteApiKey({ _barong_session, otp, kid }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/api_keys/${kid}`, {
			method: 'DELETE',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				totp_code: otp
			})
		});
		if (response.status === 204) {
			return {};
		}
		try {
			const result = await response.json();
			if (result.errors) {
				return { ...result, status: response.status };
			}
		} catch(err) {
			return err.message;
		}
		return {};
	}

	async updateApiKey({ _barong_session, otp, kid, state }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		const response = await fetch(`${baseURL}resource/api_keys/${kid}`, {
			method: 'PATCH',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: reqHeaders,
			body: JSON.stringify({
				kid,
				totp_code: otp,
				state
			})
		});
		const result = await response.json();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}

	async uploadKYCDocument({ _barong_session, doc_type, doc_number, upload, doc_expire, metadata }, headers) {
		let { baseURL, reqHeaders } = this.getUrlHeaders(_barong_session, headers);
		console.log("UPLOAD", upload);
		const tmpobj = tmp.fileSync({ postfix: upload.filename });
		const stream = upload.createReadStream();
		await new Promise((resolve, reject) => {
			const writeStream = fs.createWriteStream(tmpobj.name);
			writeStream.on('finish', resolve);
			writeStream.on('error', (error) => {
				unlink(tmpobj.name, () => {
					reject(error);
				});
			});
			stream.on('error', (error) => writeStream.destroy(error));
			stream.pipe(writeStream);
		});
		const formData = new FormData();
		formData.append('doc_type', doc_type);
		formData.append('doc_number', doc_number);
		formData.append('doc_expire', doc_expire);
		formData.append('upload[]', fs.createReadStream(tmpobj.name), upload.filename);
		// console.log('REQUEST headers', reqHeaders);
		delete reqHeaders['Content-Type'];
		const hdrs = {
			...reqHeaders,
			// 'content-type': 'multipart/form-data'
			...formData.getHeaders()
		};
		// console.log('DOC headers', hdrs);
		if (metadata) {
			formData.append('metadata', metadata);
		}
		const response = await fetch(`${baseURL}resource/documents`, {
			method: 'POST',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			referrer: 'no-referrer',
			headers: hdrs,
			body: formData
		});
		const result = await response.json();
		tmpobj.removeCallback();
		if (result.errors) {
			return { ...result, status: response.status };
		}
		return result;
	}
}

module.exports = AuthAPI;
