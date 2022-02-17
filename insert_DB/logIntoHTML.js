const fs = require('fs');
const mysql = require('mysql');


const html_file_relative_path_WRITE = "./write_file/6.html";

const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'my_table'
})

var logger = fs.createWriteStream(html_file_relative_path_WRITE, {
    flags: 'a' // 'a' means appending (old data will be preserved)
})


function writeinHTML(){
    let query = "SELECT DISTINCT(`updated_script`) FROM `script_location`";

    pool.getConnection((err, connection) => {
        if(err) throw err


        console.log(query);

        connection.query(query, (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {                

                rows.forEach((value, index)=>{
                    console.log(value.updated_script);

                    logger.write("\n"+value.updated_script);
                })

            } else {
                console.log(err);
            }            
        })
    })


}

writeinHTML();