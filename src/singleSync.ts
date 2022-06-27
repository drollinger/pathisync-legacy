import fetch from './client'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs'
import fsPromise from 'fs/promises'
import _ from 'lodash'
import {
  findFile,
  writeFile,
  promtNewFolder,
  getDirectoriesRecursive,
  getFiles,
  pushConfig,
  deleteRemoteConfig,
} from './helper'
import { optionType } from './types'

export default async function singleSync(
  topPath: string,
  urlPath: string,
  resourceType: string,
  getName: (obj: object) => string,
) {
  const resp = await fetch(urlPath)
  const body: optionType[] = await resp.json()
  let files = (await getFiles(topPath)).map((file) =>
    path.relative(process.cwd(), file),
  )

  for (const flow of body) {
    const file = await findFile(topPath, getName(flow))
    if (file) {
      const localFlow = JSON.parse(
        await fsPromise.readFile(file, { encoding: 'utf8' }),
      ) as optionType
      files = files.filter((f) => f !== file)
      delete flow.metadata
      if (!_.isEqual(flow, localFlow)) {
        console.log(
          `\nThere is a difference with the ${resourceType} ${getName(flow)}\nlocated at ${file}`,
        )
        let { option } = await inquirer.prompt([
          {
            name: 'option',
            type: 'list',
            message: 'What do you want to do?',
            choices: [
              'Nothing',
              `Overwrite local ${resourceType}`,
              `Push local ${resourceType} to remote prod`,
            ],
          },
        ])
        if (option === `Overwrite local ${resourceType}`) {
          await writeFile(flow, file)
        }
        if (option === `Push local ${resourceType} to remote prod`) {
          const resp = await pushConfig(urlPath, localFlow)
          if (resp.status === 200)
            console.log(`Successfully pushed ${getName(localFlow)}`)
          else console.log(`Failed pushing ${getName(localFlow)}`)
        }
      }
    } else {
      console.log(
        `\nThe ${resourceType} ${getName(flow)} does not exist locally`,
      )
      let { option } = await inquirer.prompt([
        {
          name: 'option',
          type: 'list',
          message: 'What do you want to do?',
          choices: [
            'Nothing',
            `Create new local ${resourceType}`,
            `Delete remote prod ${resourceType}`,
          ],
        },
      ])
      if (option === `Create new local ${resourceType}`) {
        let folderOptions = getDirectoriesRecursive(topPath + '/.')
        folderOptions = folderOptions.map((folder) =>
          folder.split('/').slice(2).join('/'),
        )
        folderOptions.push('<New Folder>')
        let { folder } = await inquirer.prompt([
          {
            name: 'folder',
            type: 'list',
            message: 'Choose a folder in ' + topPath,
            choices: folderOptions,
          },
        ])
        if (folder === '<New Folder>') {
          folder = await promtNewFolder()
          if (!fs.existsSync(`${topPath}/${folder}`)) {
            fs.mkdirSync(`${topPath}/${folder}`, { recursive: true })
          }
        }
        await writeFile(flow, `${topPath}/${folder}/${getName(flow)}.json`)
      }
      if (option === `Delete remote prod ${resourceType}`) {
        const resp = await deleteRemoteConfig(`${urlPath}/${getName(flow)}`)
        if (resp.status === 200)
          console.log(`Successfully deleted ${getName(flow)}`)
        else console.log(`Failed deleting ${getName(flow)}`)
      }
    }
  }
  for (const file of files) {
    const localFlow = JSON.parse(
      await fsPromise.readFile(file, { encoding: 'utf8' }),
    ) as optionType
    console.log(
      `\nThe remote prod doesn't have the ${resourceType} ${getName(localFlow)}\nlocated at ${file}`,
    )
    let { option } = await inquirer.prompt([
      {
        name: 'option',
        type: 'list',
        message: 'What do you want to do?',
        choices: [
          'Nothing',
          `Push new ${resourceType} to prod`,
          `Delete local ${resourceType}`,
        ],
      },
    ])
    if (option === `Push new ${resourceType} to prod`) {
      const resp = await pushConfig(urlPath, localFlow)
      if (resp.status === 200)
        console.log(`Successfully pushed ${getName(localFlow)}`)
      else console.log(`Failed pushing ${getName(localFlow)}`)
    }
    if (option === `Delete local ${resourceType}`) {
      await fsPromise.unlink(file)
      console.log(`Deleted ${file}`)
    }
  }
}
