const { moonPhase, moonPhaseLevel } = require('./moon_phase')

const weatherConditions = {}

weatherConditions.moon = {
  0: {
    emoji: '\ud83c\udf11',
    zh: '新月',
    ja: '新月',
    en: 'New Moon'
  },
  1: {
    emoji: '\ud83c\udf12',
    zh: '娥眉月',
    ja: '眉月',
    en: 'Waxing Crescent Moon'
  },
  2: {
    emoji: '\ud83c\udf13',
    zh: '上弦月',
    ja: '上弦の月',
    en: 'Quarter Moon'
  },
  3: {
    emoji: '\ud83c\udf14',
    zh: '上凸月',
    ja: '待宵月',
    en: 'Waxing Gibbous Moon'
  },
  4: {
    emoji: '\ud83c\udf15',
    zh: '满月',
    ja: '満月',
    en: 'Full Moon'
  },
  5: {
    emoji: '\ud83c\udf16',
    zh: '下凸月',
    ja: '寝待月',
    en: 'Waning Gibbous Moon'
  },
  6: {
    emoji: '\ud83c\udf17',
    zh: '下弦月',
    ja: '下弦の月',
    en: 'Last Quarter Moon'
  },
  7: {
    emoji: '\ud83c\udf18',
    zh: '残月',
    ja: '暁月',
    en: 'Waning Crescent Moon'
  }
}

weatherConditions.cloud = {
  100: {
    emoji: '\u2600\ufe0f',
    emojiNight: '\ud83c\udf0c\u2728',
    zh: '晴',
    en: 'Sunny/Clear',
    ja: '晴れ'
  },
  101: {
    emoji: '\ud83c\udf25',
    emojiNight: '\u2728\u2601\ufe0f',
    zh: '多云',
    en: 'Cloudy',
    ja: '曇り'
  },
  102: {
    emoji: '\ud83c\udf24',
    emojiNight: '\u2728',
    zh: '少云',
    en: 'Few Clouds',
    ja: '薄曇り'
  },
  103: {
    emoji: '\u26c5\ufe0f',
    emojiNight: '\ud83c\udf0c\u2728\u2601\ufe0f',
    zh: '晴间多云',
    en: 'Partly Cloudy',
    ja: '晴れ間'
  },
  104: {
    emoji: '\u2601\ufe0f',
    zh: '阴',
    en: 'Overcast',
    ja: '本曇り'
  }
}

weatherConditions.wind = {
  200: {
    emoji: '\ud83c\udf2c',
    zh: '有风',
    en: 'Windy',
    ja: '風'
  },
  201: {
    emoji: '\ud83c\udf2c\ud83d\udeab',
    zh: '平静',
    en: 'Calm',
    ja: '静穏'
  },
  202: {
    emoji: '\ud83c\udf2c\ud83d\udca4',
    zh: '微风',
    en: 'Light Breeze',
    ja: '弱い風'
  },
  203: {
    emoji: '\ud83c\udf2c',
    zh: '和风',
    en: 'Moderate/Gentle Breeze',
    ja: '弱い風'
  },
  204: {
    emoji: '\ud83c\udf2c\ud83c\udf2c',
    zh: '清风',
    en: 'Fresh Breeze',
    ja: '弱い風'
  },
  205: {
    emoji: '\ud83d\udca8',
    zh: '强风',
    en: 'Strong Breeze',
    ja: 'やや強い風'
  },
  206: {
    emoji: '\ud83d\udca8\u2757\ufe0f',
    zh: '疾风',
    en: 'High Wind, Near Gale',
    ja: '強い風'
  },
  207: {
    emoji: '\ud83d\udca8\u203c\ufe0f',
    zh: '大风',
    en: 'Gale',
    ja: '強い風'
  },
  208: {
    emoji: '\ud83d\udca8\ud83d\udca8',
    zh: '烈风',
    en: 'Strong Gale',
    ja: '非常に強い風'
  },
  209: {
    emoji: '\ud83c\udf00',
    zh: '狂风',
    en: 'Storm',
    ja: '暴風'
  },
  210: {
    emoji: '\ud83c\udf00\u2757\ufe0f',
    zh: '暴风',
    en: 'Violent Storm',
    ja: '猛烈な風'
  },
  211: {
    emoji: '\ud83c\udf00\u203c\ufe0f',
    zh: '飓风',
    en: 'Hurricane',
    ja: '猛烈な風'
  },
  212: {
    emoji: '\ud83c\udf2a',
    zh: '龙卷风',
    en: 'Tornado',
    ja: '竜巻'
  },
  213: {
    emoji: '\ud83c\udf00\ud83c\udf00',
    zh: '热带风暴',
    en: 'Tropical Storm',
    ja: '猛烈な風'
  }
}

weatherConditions.rain = {
  300: {
    emoji: '\ud83c\udf26',
    emojiNight: '\u2728\ud83c\udf27',
    zh: '阵雨',
    en: 'Shower Rain',
    ja: '雨もよう'
  },
  301: {
    emoji: '\ud83c\udf26\u2757\ufe0f',
    emojiNight: '\u2728\ud83c\udf27\u2757\ufe0f',
    zh: '强阵雨',
    en: 'Heavy Shower Rain',
    ja: '強い雨もよう'
  },
  302: {
    emoji: '\u26c8',
    zh: '雷阵雨',
    en: 'Thundershower',
    ja: '雷雨'
  },
  303: {
    emoji: '\u26c8\u2757\ufe0f',
    zh: '强雷阵雨',
    en: 'Heavy Thunderstorm',
    ja: '激しい雷雨'
  },
  304: {
    emoji: '\u26c8\u2744\ufe0f',
    zh: '雷阵雨伴有冰雹',
    en: 'Thundershower with Hail',
    ja: 'ひょう雷雨'
  },
  305: {
    emoji: '\ud83c\udf27',
    zh: '小雨',
    en: 'Light Rain',
    ja: '弱い雨'
  },
  306: {
    emoji: '\ud83c\udf27\u2757\ufe0f',
    zh: '中雨',
    en: 'Moderate Rain',
    ja: 'やや強い雨'
  },
  307: {
    emoji: '\ud83c\udf27\u203c\ufe0f',
    zh: '大雨',
    en: 'Heavy Rain',
    ja: '強い雨'
  },
  308: {
    emoji: '\ud83c\udf27\u26a0\ufe0f',
    zh: '极端降雨',
    en: 'Extreme Rain',
    ja: '豪雨'
  },
  309: {
    emoji: '\ud83c\udf27\ud83d\udca4',
    zh: '细雨',
    en: 'Drizzle Rain',
    ja: '霧雨'
  },
  310: {
    emoji: '\ud83c\udf27\ud83c\udf27',
    zh: '暴雨',
    en: 'Storm',
    ja: '激しい雨'
  },
  311: {
    emoji: '\ud83c\udf27\ud83c\udf27\u2757\ufe0f',
    zh: '大暴雨',
    en: 'Heavy Storm',
    ja: '非常に激しい雨'
  },
  312: {
    emoji: '\ud83c\udf27\ud83c\udf27\u203c\ufe0f',
    zh: '特大暴雨',
    en: 'Severe Storm',
    ja: '猛烈な雨'
  },
  313: {
    emoji: '\ud83c\udf27\u2744\ufe0f',
    zh: '冻雨',
    en: 'Freezing Rain',
    ja: '凍雨'
  },
  314: {
    emoji: '\ud83c\udf27\u2049\ufe0f',
    zh: '小到中雨',
    en: 'Light to Moderate Rain',
    ja: '弱いからやや強い雨'
  },
  315: {
    emoji: '\ud83c\udf27\u2757\ufe0f\u2049\ufe0f',
    zh: '中到大雨',
    en: 'Moderate to Heavy Rain',
    ja: 'やや強いから強い雨'
  },
  316: {
    emoji: '\ud83c\udf27\ud83c\udf27\u2753',
    zh: '大到暴雨',
    en: 'Heavy Rain to Storm',
    ja: '強いから激しい雨'
  },
  317: {
    emoji: '\ud83c\udf27\ud83c\udf27\u2049\ufe0f',
    zh: '暴雨到大暴雨',
    en: 'Storm to Heavy Storm',
    ja: '激しいから非常に激しい雨'
  },
  318: {
    emoji: '\ud83c\udf27\ud83c\udf27\u2757\ufe0f\u2049\ufe0f',
    zh: '大暴雨到特大暴雨',
    en: 'Heavy Storm to Severe Storm',
    ja: '非常に激しいから猛烈な雨'
  },
  399: {
    emoji: '\ud83c\udf27',
    zh: '雨',
    en: 'Rain',
    ja: '雨'
  }
}

weatherConditions.snow = {
  400: {
    emoji: '\ud83c\udf28',
    zh: '小雪',
    en: ' Light Snow',
    ja: '弱い雪'
  },
  401: {
    emoji: '\ud83c\udf28\u2757\ufe0f',
    zh: '中雪',
    en: 'Moderate Snow',
    ja: '強い雪'
  },
  402: {
    emoji: '\ud83c\udf28\u203c\ufe0f',
    zh: '大雪',
    en: 'Heavy Snow',
    ja: '大雪'
  },
  403: {
    emoji: '\ud83c\udf28\ud83c\udf28',
    zh: '暴雪',
    en: 'Snowstorm',
    ja: '豪雪'
  },
  404: {
    emoji: '\ud83c\udf27\ud83c\udf28',
    zh: '雨夹雪',
    en: 'Sleet',
    ja: 'みぞれ'
  },
  405: {
    emoji: '\u2614\ufe0f\u2603\ufe0f',
    zh: '雨雪天气',
    en: 'Rain And Snow',
    ja: '雨雪天気'
  },
  406: {
    emoji: '\ud83c\udf26\ud83c\udf28',
    emojiNight: '\u2728\ud83c\udf27\ud83c\udf28',
    zh: '阵雨夹雪',
    en: 'Shower Snow',
    ja: 'みぞれもよう'
  },
  407: {
    emoji: '\ud83c\udf25\ud83c\udf28',
    emojiNight: '\u2728\ud83c\udf28',
    zh: '阵雪',
    en: 'Snow Flurry',
    ja: '雪もよう'
  },
  408: {
    emoji: '\ud83c\udf28\u2049\ufe0f',
    zh: '小到中雪',
    en: 'Light to Moderate Snow',
    ja: '弱いから強い雪'
  },
  409: {
    emoji: '\ud83c\udf28\u2757\ufe0f\u2049\ufe0f',
    zh: '中到大雪',
    en: 'Moderate to Heavy Snow',
    ja: '強いから大雪'
  },
  410: {
    emoji: '\ud83c\udf28\ud83c\udf28\u2753',
    zh: '大到暴雪',
    en: 'Heavy Snow to Snowstorm',
    ja: '大から豪雪'
  },
  499: {
    emoji: '\ud83c\udf28',
    zh: '雪',
    en: 'Snow',
    ja: '雪'
  }
}

weatherConditions.fog = {
  500: {
    emoji: '\ud83c\udf2b\ud83d\udca4',
    zh: '薄雾',
    en: 'Mist',
    ja: '薄霧'
  },
  501: {
    emoji: '\ud83c\udf2b',
    zh: '雾',
    en: 'Foggy',
    ja: '霧'
  },
  502: {
    emoji: '\u267e',
    zh: '霾',
    en: 'Haze',
    ja: 'もや'
  },
  503: {
    emoji: '\ud83c\udf2c\ud83d\udcb2',
    zh: '扬沙',
    en: 'Sand',
    ja: '黄砂'
  },
  504: {
    emoji: '\ud83d\udcb2',
    zh: '浮尘',
    en: 'Dust',
    ja: '煙霧'
  },
  507: {
    emoji: '\ud83d\udca8\ud83d\udcb2',
    zh: '沙尘暴',
    en: 'Duststorm',
    ja: '激しい黄砂'
  },
  508: {
    emoji: '\ud83c\udf2a\ud83d\udcb2',
    zh: '强沙尘暴',
    en: 'Sandstorm',
    ja: '猛烈な黄砂'
  },
  509: {
    emoji: '\ud83c\udf2b\u2757\ufe0f',
    zh: '浓雾',
    en: 'Dense fog',
    ja: '濃霧'
  },
  510: {
    emoji: '\ud83c\udf2b\u203c\ufe0f',
    zh: '强浓雾',
    en: 'Strong fog',
    ja: '強い濃霧'
  },
  511: {
    emoji: '\u267e\u2757\ufe0f',
    zh: '中度霾',
    en: 'Moderate Haze',
    ja: '強いもや'
  },
  512: {
    emoji: '\u267e\u203c\ufe0f',
    zh: '重度霾',
    en: 'Heavy Haze',
    ja: '激しいもや'
  },
  513: {
    emoji: '\u267e\u267e',
    zh: '严重霾',
    en: 'Severe Haze',
    ja: '非常に激しいもや'
  },
  514: {
    emoji: '\ud83c\udf01',
    zh: '大雾',
    en: 'Heavy Fog',
    ja: '激しい濃霧'
  },
  515: {
    emoji: '\ud83c\udf01\ud83c\udf01',
    zh: '特强浓雾',
    en: 'Extra Heavy Fog',
    ja: '非常に激しい濃霧'
  }
}

weatherConditions.others = {
  900: {
    emoji: '\ud83e\udd75',
    zh: '热',
    en: 'Hot',
    ja: '暑い'
  },
  901: {
    emoji: '\ud83e\udd76',
    zh: '冷',
    en: 'Cold',
    ja: '寒い'
  },
  999: {
    emoji: '\ud83d\ude44',
    zh: '未知',
    en: 'Unknown',
    ja: '不明'
  }
}

const emojiList = {}

emojiList.moon = '\ud83c\udf19\ud83c\udf11\ud83c\udf12\ud83c\udf13\ud83c\udf14\ud83c\udf15\ud83c\udf16\ud83c\udf17\ud83c\udf18'
emojiList.cloud = '\u2728\u2600\ufe0f\ud83c\udf24\u26c5\ufe0f\ud83c\udf25\u2601\ufe0f\ud83c\udf0c'
emojiList.wind = '\ud83c\udf2c\ud83d\udca8\ud83c\udf00\ud83c\udf2a'
emojiList.rain = '\ud83c\udf26\ud83c\udf27\u26c8\u2744\ufe0f'
emojiList.snow = '\ud83c\udf28\u2614\ufe0f\u2603\ufe0f'
emojiList.fog = '\ud83c\udf2b\u267e\ud83d\udcb2\ud83c\udf01'
emojiList.others = '\ud83e\udd75\ud83e\udd76\ud83d\ude44'

const promptEmojiList = '\ud83c\udf19\u2601\ufe0f\ud83c\udf2c\ud83c\udf27\ud83c\udf28\ud83c\udf2b\ud83d\ude44'

function formatLegend (queryEmoji, lang) {
  let emojiSet
  const order = ['others', 'fog', 'snow', 'rain', 'wind', 'cloud', 'moon']
  for (const emojiSetKey of order) {
    if (emojiList[emojiSetKey].match(queryEmoji)) {
      emojiSet = weatherConditions[emojiSetKey]
      break
    }
  }
  if (!emojiSet) {
    switch (lang) {
      case 'ja':
        return `${promptEmojiList} のいずれかを入力してください`
      case 'zh':
        return `没有找到要查询的图例，使用 ${promptEmojiList} 中的一个`
      default:
        return `What legend do you want, use one of ${promptEmojiList}`
    }
  }
  const title = lang === 'ja' ? '凡例：' : lang === 'zh' ? '图例：' : 'Legend:'
  return title + '\n' + Object.values(emojiSet).map(wc => {
    const name = wc[lang] || wc.en
    let emoji = wc.emoji
    if (wc.emojiNight) emoji += `/${wc.emojiNight}`
    return `${name} ${emoji}`
  }).join('\n')
}

function formatWeather (current, daily) {
  try {
    const code = current.now.cond_code
    const keyMap = {
      1: 'cloud', 2: 'wind', 3: 'rain', 4: 'snow', 5: 'fog', 9: 'others'
    }
    const wc = weatherConditions[keyMap[code[0]]][code]
    let emoji = wc.emoji
    if (daily && daily.daily_forecast && daily.daily_forecast.length) {
      const today = daily.daily_forecast[0]
      const toISOTZ = (tzStr) => {
        const decimal = (+tzStr / 100).toFixed(4)
        const str = `${decimal < 0 ? '-' : ''}${decimal.substr(decimal.indexOf('.') + 1)}`
        return str === '0000' || str === '-0000' ? 'Z' : str
      }
      const toTZOffset = (tzStr) => {
        return -60 * +tzStr
      }
      const time2Date = (timeStr) => {
        return new Date(`${today.date}T${timeStr}${toISOTZ(current.basic.tz)}`)
      }
      const mr = time2Date(today.mr); const ms = time2Date(today.ms)
      const sr = time2Date(today.sr); const ss = time2Date(today.ss)
      const ds = time2Date('00:00'); const de = time2Date('23:59:59.999')
      const now = new Date()
      if (now < sr || now > ss) {
        emoji = wc.emojiNight
        const timesYouCanSeeMoon = []
        if (mr < ms) {
          if (mr < sr) timesYouCanSeeMoon.push([mr, sr])
          if (ss < ms) timesYouCanSeeMoon.push([ss, ms])
        } else {
          timesYouCanSeeMoon.push([ds, ms < sr ? ms : sr])
          timesYouCanSeeMoon.push([mr < ss ? ss : mr, de])
        }
        for (const duration of timesYouCanSeeMoon) {
          if (now > duration[0] && now < duration[1]) {
            emoji = emoji.replace(
              /\u2728/g,
              weatherConditions.moon[
                moonPhaseLevel(moonPhase(now, toTZOffset(current.basic.tz)))
              ].emoji
            )
            break
          }
        }
      }
    }
    return `${current.basic.location} ${emoji} ${current.now.tmp}°C`
  } catch (err) {
    return 'Internal error.'
  }
}

module.exports = {
  formatLegend,
  formatWeather
}
