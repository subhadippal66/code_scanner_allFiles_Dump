const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');


const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'my_table'
})

const txt_file_relative_path_READ = "./output1_2.txt";

processLineByLine();
async function processLineByLine() {
    const fileStream = fs.createReadStream(txt_file_relative_path_READ);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
   
  
    let line_no = 1;
    for await (const line of rl) {
        
        let arr = line.split('--**--');

        // insert in sql
        insertSql(arr);

      line_no++;
    }
}

function insertSql(arr){
    pool.getConnection((err, connection) => {
        if(err) throw err

        let insert_query = "INSERT INTO `script_version` (`name`, `version`, `url`) VALUES ('"+arr[0]+"', '"+arr[1]+"', '"+arr[2]+"')";

        // console.log(insert_query);

        connection.query(insert_query, (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {                
                // console.log(rows);
                // console.log('.');
            } else {
                console.log(err);
            }            
        })
    })
}