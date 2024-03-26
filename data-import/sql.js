// Usage: node generate.js
// Description: 生成导入语保数据库的 SQL 语句
// 生成 word.sql 和 pron.sql 两个文件，分别用于导入词汇和方言语音文件
// 具体导入格式可以进行微调，比如修改贡献者id、审核者id、语音文件的URL地址等

const fs = require('fs')
const ipa = {} // 用以存储方言词汇的音标，导入语音文件时使用

// tsv 文件怎么来的：把语保的 Excel 表格按 unicode 输出 txt 文件就是 tsv 格式 （ TAB 分隔）
fs.writeFileSync('./word.sql', generateWordSql('词汇.tsv').join('\r\n'));

// 导入时需要使用方言词汇的音标，所以需要先生成 word.sql
fs.writeFileSync('./pron.sql', generatePronSql('方言语音文件夹').join('\r\n'));


function generateWordSql(wordFile) {
  const sql = []
  lines = fs.readFileSync(wordFile).toString().split('\r\n')
  // 去除第一行的表头
  lines.shift()
  for (const line of lines) {
    const [id, mandarin, word, pron, comment] = line.split('\t')
    let record = {
      id: id,
      word: word, // 以方言词汇作为检索词
      definition: `${mandarin}。${comment}`,
      annotation: "",
      mandarin: `[${mandarin}]`,
      views: 0,
      standard_ipa: pron,
      standard_pinyin: pron,
      visibility: 0,
      contributor_id: 1 // 贡献者id，注意修改
    };
    sql.push(`INSERT INTO word_word(id, word, definition, annotation, mandarin, views, standard_ipa, standard_pinyin, visibility, contributor_id) values (${record.id},"${record.word}", "${record.definition}", "${record.annotation}", "${record.mandarin}", ${record.views}, "${record.standard_ipa}", "${record.standard_pinyin}", ${record.visibility}, ${record.contributor_id});`)
    ipa[id] = pron
  }
  return sql
}

function generatePronSql(path, ipa) {
  const sql = []
  fs.readdirSync(path).forEach(file => {
    const id = file.substring(0, 4)
    let data = {
      source: `http://localhost:8000/files/audio/user/${file}`, // 语音的URL地址，注意修改
      ipa: ipa[id],
      pinyin: ipa[id],
      county: '县区',
      town: '乡镇',
      visibility: 0,
      views: 0,
      contributor_id: 1, // 贡献者id，注意修改
      word_id: id,
      verifier_id: 1 // 审核者id，注意修改
    };
    sql.push(`INSERT INTO word_pronunciation("source", ipa, pinyin, county, town, visibility, views, contributor_id, word_id, verifier_id) VALUES('${data.source}', '${data.ipa}', '${data.pinyin}', '${data.county}', '${data.town}', ${data.visibility}, ${data.views}, ${data.contributor_id}, ${data.word_id}, ${data.verifier_id});`);
  })
  return sql;
}
