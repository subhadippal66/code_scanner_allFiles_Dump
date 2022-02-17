const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const mysql = require('mysql');


const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'my_table'
})

const html_file_relative_path_WRITE = "./log2.txt";
var logger = fs.createWriteStream(html_file_relative_path_WRITE, {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

// let path = 'https://snyk.io/test/npm/'+'lazysizes'+'/'+'5.2.0-beta1'

// ajax(path)
getNameAndVersion();
function getNameAndVersion(){
    pool.getConnection((err, connection) => {
        if(err) throw err

        let selectQuery = "SELECT * FROM `script_version` WHERE length(version)>0 AND length(name)>2";

        // console.log(selectQuery);

        connection.query(selectQuery, (err, rows) => {
            // connection.release() // return the connection to pool
            if (!err ) {                
                // console.log(rows);
                // logger.write(JSON.stringify(rows));
                rows.forEach(e => {
                    

                    let likeQuery = 'select * from `synk_main` where `packageName` like "%'+e['name']+'%"';

                    connection.query(likeQuery,(err_1,rows_1)=>{
                        // connection.release();
                        if(!err_1){
                            rows_1.forEach(ele=>{
                                let path = 'https://snyk.io/test/npm/'+ele['packageName']+'/'+e['version'];
                                ajax(path, e['id'], ele['packageName'], e['version']);
                            })
                            let path = 'https://snyk.io/test/npm/'+e['name']+'/'+e['version'];
                            ajax(path, e['id'], e['name'], e['version']);
                        }
                    })
                });
                // connection.release() // return the connection to pool
                // console.log('.');
            } else {
                console.log(err);
            }            
        })
    })
}



async function ajax(path, rowid, pkgname, version){

    https.get(path, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        // logger.write(data);

        const $ = cheerio.load(data);
        let result_ = $('.meta-table__data');

        let no_of_vul = $(result_[0]).text().replace(/ /g, "").replace('\n','');
        logger.write('\n'+rowid+'||--||'+pkgname+'||--||'+version+'||--||'+no_of_vul);

        console.log(no_of_vul[0]);
    });


    }).on("error", (err) => {
    console.log("Error: " + err.message);
    });

}