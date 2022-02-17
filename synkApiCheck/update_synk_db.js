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

const txt_file_relative_path_READ = './log1.txt'

processLineByLine();

async function processLineByLine() {
    const fileStream = fs.createReadStream(txt_file_relative_path_READ);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
   
  
    let line_no = 1;
    for await (const line of rl) {
        if(line.length>0){

            let arr = line.split('||--||')
            if(arr[0]){
                pool.getConnection((err, connection) => {
                    if(err) throw err
                    
                    let synk_check = 2;
                    if(arr[3]!=null && arr[3]!=''){
                        if(parseInt( arr[3][0] )>0){
                            synk_check = 1;
                        }else{
                            synk_check = 0;
                        }
                    }

                    let selectQuery = "UPDATE `script_version` SET synk_check="+synk_check+" where id="+arr[0];
            
                    // console.log(selectQuery);
            
                    connection.query(selectQuery, (err, rows) => {
                        connection.release() // return the connection to pool
                        if (!err ) {                
                            
                        } else {
                            console.log(err);
                        }            
                    })
                })
            }




        }
      line_no++;
    }
}
