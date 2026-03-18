const http = require('http');

const run = async () => {
    // Oh wait, I can just sign a token manually since I have JWT_SECRET.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 2, email: 'dr.minh@psychohealth.com', role: 'expert', name: 'Bác sĩ Minh' }, process.env.JWT_SECRET || 'psycho-secret-key-123');

    const res = await fetch('http://127.0.0.1:3000/api/messages/3', {
        headers: { 'Cookie': `auth_token=${token}` }
    });
    
    if (res.ok) {
        const text = await res.text();
        console.log("RESPONSE:", text.substring(0, 500)); // Print first 500 chars
    } else {
        console.log("ERROR:", res.status, await res.text());
    }
};

run();
