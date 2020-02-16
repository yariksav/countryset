const countries = require('country-calling-codes/countries.json')
const countryTelData = require('country-telephone-data')

const countryPhone = countryTelData.allCountries
const isoKeys = countryTelData.iso2Lookup
const fs = require('fs')
const { join } = require('path')

const { get, pick } = require('lodash')

const splitFormatByPrefix = function (format, prefix) {
  if (!format || !prefix) {
    return
  }
  const len = prefix.length
  let pos = format.split('#', len).join('#').length + 1
  if (format.charAt(pos) === ')') {
    pos++
  }
  if (format.charAt(pos) === '-') {
    format = format.slice(0, pos) + format.slice(pos + 1) // eslint-disable-line
  }
  return [format.substring(0, pos), format.substring(pos).trim()]
}

const collect = function (args, options) {
  const data = []
  for (const country of countries) {
    if (!country.ccn3 || !country.cca2) {
      continue
    }
    const code = country.cca2.toLowerCase()
    const cca3 = country.cca3.toLowerCase()

    const currencyCode = country.currency.length ? country.currency[0] : null
    const c = countryPhone[isoKeys[code]]
    let format
    let formatSplit
    if (c) {
      format = c && c.format
      if (format) {
        format = format.replace(/\./g, '#')
        formatSplit = splitFormatByPrefix(format, c.dialCode)
      }
    }
    const names = {
      en: country.name.common
    }
    const officialNames = {
      en: country.name.official
    }
    const translations = { ...country.translations, ...country.name.native }
    for (const lang in translations) {
      names[lang.substring(0, 2)] = get(translations, `${lang}.common`)
      officialNames[lang.substring(0, 2)] = get(translations, `${lang}.official`)
    }

    data.push({
      id: +country.ccn3,
      names,
      official_names: officialNames,
      code,
      cca3,
      prefix: ((c && c.dialCode) || country.callingCode.join('|')),
      mask_phone: format,
      mask_short: formatSplit && formatSplit[1],
      currency: currencyCode,
      latitude: +country.latlng[0],
      longitude: +country.latlng[1],
      region: country.region,
      subregion: country.subregion,
      capital: country.capital,
      area: +country.area,
      details: {
        ...pick(country, ['currency', 'borders', 'tld', 'languages', 'region', 'subregion', 'capital'])
      }
    })
  }
  fs.writeFileSync(join(__dirname, '../dist/countries.json'), JSON.stringify(data, null, 2))
}

module.exports = collect
