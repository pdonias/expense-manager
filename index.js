#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const fs = require('fs')
const pkg = require('./package.json')
const sqlite3 = require('sqlite3').verbose()
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { JWT } = require('google-auth-library')
const { open } = require('sqlite')
const { program } = require('commander')

async function main() {
  const opts = program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version)
    .option('-i, --input <file.expensemanager>', 'input file')
    .option('-o, --output <file.csv>', 'output file')
    .option(
      '-c, --decimal-commas',
      'use decimal commas instead of dots in CSV file'
    )
    .option('-g, --gsheets', 'output to Google Sheets')
    .parse(process.argv)
    .opts()

  if (opts.input === undefined) {
    program.help()
    process.exit(1)
  }

  // Read Sqlite database and query all transactions
  console.log(`Reading ${opts.input}`)
  const db = await open({
    filename: opts.input,
    driver: sqlite3.Database,
  })

  const rows = await db.all(
    `SELECT
      STRFTIME('%d/%m/%Y', DATE(timestamp / 1000, 'unixepoch')) as date,
      Category.name as category,
      CAST(debit as REAL) / 100 as amount,
      note as description
    FROM TransactionItem
    LEFT JOIN Category ON categoryId = Category.id
    WHERE TransactionItem.visible = 1
    ORDER BY timestamp
    ;`
  )

  console.log(
    `Found ${rows.length} entries. Last entry:`,
    rows[rows.length - 1]
  )

  if (opts.output === undefined && !opts.gsheets) {
    console.log('Nothing to do!')
  }

  // Generate and write CSV file
  if (opts.output !== undefined) {
    const _rows = opts.decimalCommas
      ? rows.map(row => ({
          ...row,
          amount: String(row.amount).replace('.', ','),
        }))
      : rows

    const csv = _rows
      .reduce(
        (csv, row) =>
          csv +
          `${row.date},"${row.category ?? ''}",,"${row.amount}","${row.description}"\n`,
        ''
      )
      .slice(0, -1) // Remove trailing newline

    fs.writeFileSync(opts.output, csv)

    console.log(
      `Correctly exported CSV to ${opts.output}. Last entry: ${csv.slice(
        csv.lastIndexOf('\n') + 1
      )}`
    )
  }

  // Sync with Google Sheets
  if (opts.gsheets) {
    // Check that all the required environment variables are set
    const requiredEnvVars = [
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_SHEET_ID',
      'GOOGLE_SHEET_TITLE',
    ]
    const missingVariables = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )
    if (missingVariables.length > 0) {
      throw new Error(
        `Missing environment variable(s): ${missingVariables.join(', ')}.
Check out how to create a Google Service Account here: https://robocorp.com/docs-robot-framework/development-guide/google-sheets/interacting-with-google-sheets#create-a-google-service-account
Then provide the required environment variables thanks to the JSON file you downloaded.`
      )
    }

    // Open document
    const jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const gDoc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt)
    await gDoc.loadInfo()

    // Open and edit specified sheet
    const gSheet = gDoc.sheetsByTitle[process.env.GOOGLE_SHEET_TITLE]
    await gSheet.setHeaderRow(['date', 'category', '', 'amount', 'description'])
    await gSheet.clearRows()
    await gSheet.addRows(rows)

    console.log(`Correctly uploaded to "${gDoc.title}"`)
  }
}

main().then(() => console.log('Done'), console.error)
