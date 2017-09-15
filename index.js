var mysql = require('mysql');
const LOCAL = "local";
const SERVER = "server"

const location ={
    server: {
        host: process.env.TARGET_HOST,
        user: process.env.TARGET_USERNAME,
        password: process.env.TARGET_PASSWORD,
        database: process.env.TARGET_DATABASE
    },
    local: {
        host: process.env.SRC_HOST,
        user: process.env.SRC_USERNAME,
        password: process.env.SRC_PASSWORD,
        database: process.env.SRC_DATABASE
    }
};
var pool = {
    server: mysql.createPool(location.server),
    local: mysql.createPool(location.local)
}

const query = ({ host, mysql, data }) => {
    return new Promise((res, rej) => {
        pool[host].getConnection(function (err, connection) {
            var query = connection.query(mysql, data, (error, results, fields) => {
                connection.release();
                if (error) throw error;
                res({ error, results, fields })
            });
            // console.log(query.sql)
        });
    })
}

// Room
const local2Server = async({ src, tar }) =>{
    const room = {
        local: {
            data: await query({ host: LOCAL, mysql: 'SELECT * FROM `' + src +'`' })
        },
        serve: {
            data: await query({ host: SERVER, mysql: 'SELECT * FROM `' + tar +'`' }),
            describe: await query({ host: SERVER, mysql: "describe " + tar})
        }
    }
    let { local, serve } = room;
    // console.log("Server ==========================")
    
    let RoomModel = {}
    // serve.data.fields.map((field, index) => {
    //     let { name } = field;
    //     RoomModel[name] = null
    //     console.log(" -",index+1, name)
    // })
    // console.log("describe", serve.describe)    
    // serve.describe.results.map((desc)=>{
    //     console.log({desc})
    // })

    // console.log("local ==========================")
    
    // local.data.fields.map((field, index) => {
    //     let { name } = field;
    //     console.log(" -",index+1,name)
    // })

    // console.log("==========================")    

    

    console.log({ RoomModel})

    let list = []
    let listData = [];
    local.data.results.map((room) => {
        var data = {}
        serve.describe.results.map((desc) => {
            let { Field, Null, Default, Type } = desc
            if (Null == 'NO' && room[Field] == null) {
                const _ING = 'int'
                const _VARCHAR = 'varchar'

                if (Type.match(_ING)) {
                    const max = 0;
                    const min = 100;
                    data[Field] = Number(Math.random() * (max - min) + min);
                }

                if (Type.match(_VARCHAR)) {
                    data[Field] = '-';
                }
            } else {
                switch (Field) {
                    case "created_at":
                        data['created_at'] = new Date().toLocaleString();
                        break;

                    case "updated_at":
                        data['updated_at'] = new Date().toLocaleString();
                        break;

                    default:
                        data[Field] = room[Field]
                        break;
                }
            }
        })

        list.push(Object.values(data))
        listData.push(data)
    })
    console.log(listData[0])            
    await query({ host: SERVER, mysql: 'INSERT INTO `' + tar +'` VALUES ?', data: [list] })   
}

// MAIN
( async () =>{
    const TABLE = {
        src: process.argv[2],
        tar: process.argv[3]
    }
    console.log(TABLE.src, " ==> ", TABLE.tar)
    await local2Server({ src: TABLE.src, tar: TABLE.tar});
    process.exit()        
})();