import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { resolve } from 'path'
import inquirer from 'inquirer'
import fetch from './client'

export async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    }),
  )
  return Array.prototype.concat(...files)
}

export async function findFile(dir: string, filename: string) {
  const files = await getFiles(dir)
  const filteredList = files
    .filter((file) => path.parse(file).name === filename)
    .map((file) => path.relative(process.cwd(), file))
  if (filteredList.length > 1)
    throw new Error(`Duplicate Filenames Found!\n${filteredList.join('\n')}`)
  return filteredList[0] ?? null
}

export async function findFileWithPath(dir: string, filePath: string) {
  const files = await getFiles(dir)
  const filteredList = files
    .filter((file) => file.endsWith(filePath))
    .map((file) => path.relative(process.cwd(), file))
  if (filteredList.length > 1)
    throw new Error(`Duplicate Filenames Found!\n${filteredList.join('\n')}`)
  return filteredList[0] ?? null
}

export async function writeFile(flow: object, filePath: string) {
  await fsPromises.writeFile(filePath, JSON.stringify(flow, null, 2))
  console.log('File "' + filePath + '" Saved')
}

export async function promtFolder(folders: string[]) {
  return await inquirer.prompt([
    {
      name: 'folder',
      type: 'list',
      message: 'Choose a folder',
      choices: folders,
    },
  ])
}

export async function promtNewFolder() {
  return await inquirer
    .prompt([
      {
        name: 'new_folder',
        type: 'input',
        message: 'Enter new folder name:',
      },
    ])
    .then((resp) => resp.new_folder)
}

function flatten(lists: string[][]) {
  return lists.reduce((a, b) => a.concat(b), [])
}

function getDirectories(srcpath: string) {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter(
      (path) =>
        fs.statSync(path).isDirectory() &&
        !fs.existsSync(path + '/_collection.json'),
    )
}

export function getDirectoriesRecursive(srcpath: string): string[] {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ]
}

export async function pushConfig(url: string, data: object) {
  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteRemoteConfig(url: string) {
  return await fetch(url, { method: 'DELETE' })
}
