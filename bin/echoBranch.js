const fs = require('fs');

const file = fs.readFileSync('src/greenblue.json');
const json = JSON.parse(file);
console.log(json.branch);
