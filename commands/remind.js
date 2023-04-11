const {EmbedBuilder} = require('discord.js');
const moment = require('moment');
moment.locale('es');

const Remind = require('../models/remind');

function generateTemporalTimer (toMs, message, remind) {
    if (toMs > 2147483647) return; // tenmporal fix | 24.85 días es el límite. todo: rework

    setTimeout(async () => {
        let embed = new EmbedBuilder()
            .setColor(process.env.BOT_COLOR)
            .setAuthor({
                name: `Recordatorio (${moment(remind.createdAt).fromNow()})`,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(`${remind.message}`)
            .setFooter({
                text: `¡Gracias por usar nuestro servici🍪! | ${moment(remind.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a')}`
            });

        // Actualizar
        await Remind.updateOne({ _id: remind._id }, {
            isReminded: true
        });

        // Responder
        await message.channel.send({
            content: `<@${remind.userID}>`,
            embeds: [embed]
        });
    }, toMs);
}

async function commandList (message) {
    const list = [];
    let index = 1;

    // Buscar
    const reminds = await Remind.find({
        userID: message.author.id,
        isReminded: false
    }).sort({
        date: 1
    });

    // Por cada remind
    reminds.map((r) => {
        let getDate = r.date;
        let toMs = moment(getDate).valueOf() - moment().valueOf();

        if (toMs <= 0) return;

        // Crear string
        let id = index++; // index + 1
        let timeFromNow = moment(r.date).fromNow();
        let timeDetailed = moment(r.date).calendar();
        let toPush = `${id} - ${timeDetailed} (${timeFromNow})`;

        // Agregar string a la lista (array)
        list.push(toPush);
    });

    if (!reminds || list.length <= 0) return message.channel.send(`**${message.author.username}**, no tienes ningún recordatorio!`); // todo: Embed

    // Responder
    let embed = new EmbedBuilder()
        .setColor(process.env.BOT_COLOR)
        .setAuthor({
            name: `Recordatorios | Lista de ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setFooter({
            text: `¡Gracias por usar nuestro servici🍪!`
        })
        .setDescription(list.join("\n"));

    return await message.channel.send({ embeds: [embed] });
}

module.exports = {
	name: 'remind',
    description: 'Crea un recordatorio!',
    aliases: ['remindme', 'rm', 'reminder', 'recordar'],
    usage: '1 (m, h, d, s) | [mensaje]',
	async execute (message, args) {
        // Ejemplo de uso
        let example = `**${message.author.username}**, ejemplo de uso: ${process.env.BOT_PREFIX}${this.name} ${this.usage}`;
        // Si no hay args mostrar ejemplo
        if (!args || args.length <= 0) return message.channel.send({
            content: example
        });

        // Comando List
        if (args[0].toLowerCase() === "list") return commandList(message);

        // Comprobar si el comando es válido
        if (!args.join(' ').split('|')[0] || !args.join(' ').split('|')[1]) return message.channel.send({
            content: example
        });

        // Obtener Datos del mensaje (parsing)
        const msg = args.join(' ').split('|'); // 3d | hello
        const getDate = msg[0].toString(); // 3d
        const getMessage = msg[1].toString().trim(); // trimming: " hello" => "hello"

        if (!getMessage || getMessage.length <= 0) return message.channel.send({ content: example });

        // Convertir a fecha
        const actualDate = moment();
        let getDateInfo = 0;
        let setDate = actualDate;

        // Fechas
        if (getDate.includes('/')) {
            let fullDate = getDate.split('/');

            let getDay = fullDate[0];
            let getMonth = fullDate[1];
            let getYear = fullDate[2];

            // Si faltan dataos
            if (!getDay || !getMonth || !getYear) return message.channel.send({ content: example });

            // Agregar fecha
            setDate = moment(`${getDay}-${getMonth}-${getYear}`, 'DD/MM/YY');
        } else {
            // m
            if (getDate.includes('m')) {
                getDateInfo = parseInt(getDate.split('m')[0]);
                setDate.add(getDateInfo, 'minutes');
            }
            // h
            if (getDate.includes('h')) {
                // moment(setDate).add(getDateInfo, 'hours'); // idea?
                getDateInfo = parseInt(getDate.split('h')[0]);
                setDate.add(getDateInfo, 'hours');
            }

            // d
            if (getDate.includes('d')) {
                getDateInfo = parseInt(getDate.split('d')[0]);
                setDate.add(getDateInfo, 'days');
            }
            // s
            if (getDate.includes('s')) {
                getDateInfo = parseInt(getDate.split('s')[0]);
                setDate.add(getDateInfo, 'weeks');
            }
            // y?
        }

        // Modelo
        const remind = new Remind({
            userID: message.author.id,

            // dm: false,
            guild: message.guild.id,
            channel: message.channel.id,

            message: getMessage,
            date: setDate
        });

        // Guardar
        await remind.save();

        // Responder
        let embed = new EmbedBuilder()
            .setColor(process.env.BOT_COLOR)
            .setAuthor({
                name: `Recordatorio para ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(`💌 Se guardó tu recordatorio; te lo recordaré **${setDate.fromNow()}**.`);

        await message.channel.send({
            embeds: [embed]
        });
        await message.delete(); // todo: opcional?

        // Crear timer
        let toMs = moment(remind.date).valueOf() - moment().valueOf();
        generateTemporalTimer(toMs, message, remind);
	}
}
