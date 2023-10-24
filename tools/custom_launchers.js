module.exports.getCustomLaunchers = (CHROME = 'Chrome') => ({
  // For browserstack configs see:
  // https://www.browserstack.com/automate/node
  bs_chrome_mac: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest',
    os: 'OS X',
    os_version: 'High Sierra',
    flags: [
      // For tfjs-data
      '--autoplay-policy=no-user-gesture-required',
    ],
  },
  bs_firefox_mac: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: '90',
    os: 'OS X',
    os_version: 'High Sierra'
  },
  bs_safari_mac: {
    base: 'BrowserStack',
    browser: 'safari',
    browser_version: 'latest',
    os: 'OS X',
    os_version: 'Mojave'
  },
  bs_ios_12: {
    base: 'BrowserStack',
    device: 'iPhone XS',
    os: 'ios',
    os_version: '12.3',
    real_mobile: true
  },
  bs_ios_15: {
    base: 'BrowserStack',
    device: 'iPhone 11 Pro',
    os: 'ios',
    os_version: '15',
    real_mobile: true
  },
  bs_android_10: {
    base: 'BrowserStack',
    device: 'Google Pixel 4 XL',
    os: 'android',
    os_version: '10.0',
    real_mobile: true
  },
  win_10_chrome: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: '104.0',
    os: 'Windows',
    os_version: '10',
    flags: [
      // For tfjs-data
      '--autoplay-policy=no-user-gesture-required',
    ],
  },
  bs_chrome_mac_webgpu: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest',
    os: 'OS X',
    os_version: 'High Sierra',
    flags: [
      '--enable-unsafe-webgpu',  // Can be removed after WebGPU release
      '--use-webgpu-adapter=swiftshader',

      // https://github.com/tensorflow/tfjs/issues/7631
      '--disable-vulkan-fallback-to-gl-for-testing',
    ],
  },
  chrome_with_swift_shader: {
    base: CHROME,
    flags: ['--blacklist-accelerated-compositing', '--blacklist-webgl']
  },
  chrome_autoplay: {
    base: CHROME,
    flags: [
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
    ],
  },
  chrome_webgpu_linux: {
    base: 'ChromeCanary',
    flags: [
      '--enable-features=Vulkan',
      '--enable-unsafe-webgpu',
      '--disable-dawn-features=disallow_unsafe_apis',
    ]
  },
  chrome_webgpu: {
    base: 'ChromeCanary',
    flags: [
      '--disable-dawn-features=disallow_unsafe_apis',
      '--no-sandbox',
    ]
  },
  chrome_debugging: {
    base: 'Chrome',
    flags: ['--remote-debugging-port=9333'],
  },
  chrome_no_sandbox: {
    base: CHROME,
    flags: ['--no-sandbox'],
  }
});
