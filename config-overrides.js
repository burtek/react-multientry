function createMapper(sharedPath) {
    return function mapRules(rule) {
        if (rule.test && rule.test.toString().indexOf('tsx') >= 0 && rule.include) {
            return {
                ...rule,
                include: [rule.include, sharedPath]
            };
        }
        if (rule.oneOf) {
            return {
                ...rule,
                oneOf: rule.oneOf.map(mapRules)
            };
        }
        return rule;
    }
}

module.exports = {
    webpack(config, env) {
        var newConfig = {
            ...config,
            entry: [...config.entry],
            module: {
                ...config.module
            },
            resolve: {
                ...config.resolve,
                symlinks: true
            }
        };

        if (newConfig.mode === 'development') {
            const path = require('path');

            const srcPath = newConfig.entry.find(entry => entry.indexOf('packages') >= 0 && entry.indexOf(path.join('src', 'index.ts')) >= 0);
            const sharedPath = path.resolve(srcPath, '..', '..', '..', '..', 'shared');

            newConfig.entry.splice(newConfig.entry.indexOf(srcPath), 0, sharedPath);
            newConfig.module.rules = newConfig.module.rules.map(createMapper(sharedPath));
        }

        return newConfig;
    },
    devServer(configFunction) {
        return function (proxy, allowedHost) {
            const config = configFunction(proxy, allowedHost);
            config.watchOptions = {
                aggregateTimeout: 300,
                poll: 1000
            };
            console.log(config);
            config.hot = false;
            // config.liveReload = true;
            return config;
        };
    }
};