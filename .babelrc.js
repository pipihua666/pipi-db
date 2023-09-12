module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					ios: '11.0',
					chrome: '53',
				},
				loose: true
			},
		],
		'@babel/preset-typescript',
	]
};
