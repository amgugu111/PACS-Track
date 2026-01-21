const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = function (options, webpack) {
    return {
        ...options,
        externals: {
            // Mark Prisma as external to prevent bundling
            '.prisma/client': 'commonjs .prisma/client',
            '@prisma/client': 'commonjs @prisma/client',
        },
        plugins: [
            ...options.plugins,
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../../node_modules/.prisma/client/*.node'),
                        to: path.resolve(__dirname, 'dist/[name][ext]'),
                    },
                    {
                        from: path.resolve(__dirname, '../../node_modules/.prisma/client/schema.prisma'),
                        to: path.resolve(__dirname, 'dist/schema.prisma'),
                    },
                    {
                        from: path.resolve(__dirname, '../../node_modules/pdfkit/js/data'),
                        to: path.resolve(__dirname, 'dist/data'),
                    },
                ],
            }),
        ],
    };
};
