const jwt = require('jsonwebtoken');
const token = jwt.sign({
    userId: '5508b089-62ea-49ec-8151-0f907d3a36a1',
    email: 'john.doe@example.com',  
    role: 'advertiser'
}, 'marketingPlatform', { expiresIn: '24h' });

console.log(token);