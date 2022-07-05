const Discord = require('discord.js');
const moment = require('moment');
moment.locale('es');

const Remind = require('./models/remind');

async function setTimers(reminds, bot) {
    reminds.forEach(rm => {
        // Transformar a MS
        let getDate = rm.date;
        let toMs = moment(getDate).valueOf() - moment().valueOf();

        // Actualizar versión
        if (toMs > 2147483647) return; // temporal fix | 24.85 días es el límite
        if (toMs <= 0) toMs = 1000;

        setTimeout(async () => {
            // Recordar
            let guild = await bot.guilds.cache.find(g => g.id === rm.guild);
            if (!guild || guild.length == 0) return;
            let channel = await guild.channels.cache.find(c => c.id === rm.channel);

            // Comprobar si el usuario sigue existiendo
            if (!await bot.users.fetch(rm.userID)) return await Remind.updateOne({ _id: rm._id }, { isReminded: true }); // Si no se encuentra se ignora la notificación y se marca como recordado

            let ping = `<@${rm.userID}>`;
            let avatar = await bot.users.fetch(rm.userID);

            let embed = new Discord.MessageEmbed()
                .setColor(process.env.BOT_COLOR)
                .setAuthor({
                    name: `Recordatorio (${moment(rm.createdAt).fromNow()})`,
                    iconURL: avatar.displayAvatarURL()
                }) // workaround
                .setDescription(`${rm.message}`)
                .setFooter({
                    text: `¡Gracias por usar nuestro servici🍪! | ${moment(rm.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a')}`
                }); // después del moment se agregó como prueba

            // Actualizar
            await Remind.updateOne({ _id: rm._id }, {
                isReminded: true
            });

            // Responder
            await channel.send({
                content: `${ping}`,
                embeds: [embed]
            });
        }, toMs);
    });
};

module.exports = async (bot) => {
    // Obtener recordatorios
    const reminds = await Remind.find({
        isReminded: false
    });

    await setTimers(reminds, bot);
};
