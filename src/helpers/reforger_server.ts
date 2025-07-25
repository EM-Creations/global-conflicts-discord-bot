import * as fs from 'fs';

export async function handleServerData(data, channel) {
    try {
        if (data) {
            let text = '' + data;
            if (text.length > 0 && (
                text.includes('->') //||
                //text.includes('(E)') ||
                //text.includes('(W)')
            )) {
                await channel.send({content: text})
            }
        }
    } catch (e) {
        console.log(e);
    }
}

export function updateDefaultScenario(missionGuid, configPath) {
    const data = fs.readFileSync(configPath, 'utf8');
    let config = JSON.parse(data);
    config.game.scenarioId = missionGuid;
    fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"));
}
