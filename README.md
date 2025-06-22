# Expense Manager to CSV and Google Sheets

A tool to extract data from an [Expense Manager](https://play.google.com/store/apps/details?id=at.markushi.expensemanager) save file and export it to Google Sheets or save it as a CSV file.

## Install

Clone this repository and run:

```sh
$ npm install
```

## Usage

### Export a manual backup

- Go to your [Expense Manager](https://play.google.com/store/apps/details?id=at.markushi.expensemanager) app
- Go to Settings > Backup > Create a manual backup

This will allow you to export a file named `Backup_20xx_xx_xx.expensemanager` containing all your expense history.

### CSV

To convert it to a CSV file, run:

```sh
$ npm start -- --input Backup_20xx_xx_xx.expensemanager --output my_expenses.csv
```

### Google Sheets

To upload it to Google Sheets:
- Check out how to create a Google Service Account [here](https://robocorp.com/docs-robot-framework/development-guide/google-sheets/interacting-with-google-sheets#create-a-google-service-account)
- Create an empty Google Sheets document
- Share that document with the Google Service Account you just created
- Provide the required environment variables thanks to the JSON file you downloaded and the document you created:

```sh
$ export GOOGLE_SERVICE_ACCOUNT_EMAIL="sa-username@my-username.iam.gserviceaccount.com" # From the Google Service Account JSON file
$ export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" # From the Google Service Account JSON file
$ export GOOGLE_SHEET_ID="IRMfnSyttnNUMfYCedOihMzfI_wYRJu_NvVwzRXSTWep" # The long string of characters in the Google Sheets URL
$ export GOOGLE_SHEET_TITLE="Tabellenblatt1" # The name of the sheet itself (bottom left-hand corner)
$ npm start -- --input Backup_20xx_xx_xx.expensemanager --gsheets
```
