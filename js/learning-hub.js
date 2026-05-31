(function () {
  const SEARCH_XML_PATH = '/blog/search.xml'

  const state = {
    posts: null,
    loading: null
  }

  const normalizeText = value => (value || '').replace(/\s+/g, ' ').trim()

  const parseDateFromUrl = url => {
    const match = (url || '').match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)
    if (!match) return 0
    return Number(`${match[1]}${match[2]}${match[3]}`)
  }

  const parseRagentOrder = title => {
    const match = title.match(/^Ragent学习笔记(\d+)/)
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
  }

  const parseHot100Order = title => {
    const match = title.match(/^Hot100：[^\d]*?(\d+)/)
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
  }

  const escapeHtml = value => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const parseSearchXml = xmlText => {
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlText, 'text/xml')
    return Array.from(xml.querySelectorAll('entry')).map(entry => {
      const title = entry.querySelector('title')?.textContent?.trim() || ''
      const url = entry.querySelector('url')?.textContent?.trim() || '#'
      const rawContent = entry.querySelector('content')?.textContent || ''
      const text = rawContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        title,
        url,
        text,
        dateValue: parseDateFromUrl(url)
      }
    }).filter(post => post.title)
  }

  const loadPosts = async () => {
    if (state.posts) return state.posts
    if (state.loading) return state.loading

    state.loading = fetch(SEARCH_XML_PATH)
      .then(response => response.text())
      .then(text => {
        state.posts = parseSearchXml(text)
        return state.posts
      })
      .catch(() => {
        state.posts = []
        return state.posts
      })

    return state.loading
  }

  const extractProgressLines = text => {
    const normalized = normalizeText(text)
    const current = normalized.match(/当前阶段：[^。]*。?/)
    const next = normalized.match(/下一步：[^。]*。?/)
    return [current?.[0], next?.[0]].filter(Boolean)
  }

  const pickCurrentFocus = posts => {
    const plan = posts.find(post => post.title.includes('学习计划'))
    const ragentSeries = posts
      .filter(post => post.title.startsWith('Ragent学习笔记'))
      .sort((a, b) => parseRagentOrder(a.title) - parseRagentOrder(b.title))

    const latestRagent = ragentSeries[ragentSeries.length - 1]
    const progressLines = plan ? extractProgressLines(plan.text) : []

    return {
      title: '最近在学',
      lead: latestRagent ? latestRagent.title : 'Agent 开发学习主线',
      lines: progressLines.length ? progressLines : ['当前主线还是 Ragent 项目学习，先把基础扫盲、文档预处理和后续知识库链路持续串起来。'],
      primaryHref: latestRagent?.url || '/blog/categories/ragent/',
      primaryText: latestRagent ? '继续当前主线' : '进入 Ragent 专题',
      secondaryHref: plan?.url || '/blog/2025/10/13/Agent%E5%BC%80%E5%8F%91%E5%AD%A6%E4%B9%A0%E8%AE%A1%E5%88%92-%E8%BF%9B%E5%BA%A6/',
      secondaryText: '查看学习计划'
    }
  }

  const renderHomeHub = posts => {
    const recentPosts = document.querySelector('#recent-posts')
    if (!recentPosts) return
    if (document.querySelector('#learning-hub')) return

    const focus = pickCurrentFocus(posts)

    const hub = document.createElement('section')
    hub.id = 'learning-hub'
    hub.className = 'learning-hub'
    hub.innerHTML = `
      <div class="learning-focus">
        <div class="learning-focus-main">
          <span class="learning-hub-eyebrow">${focus.title}</span>
          <h2>${escapeHtml(focus.lead)}</h2>
          <div class="learning-focus-list">
            ${focus.lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </div>
        <div class="learning-focus-actions">
          <a class="learning-hub-main-link" href="${focus.primaryHref}">${focus.primaryText}</a>
          <a class="learning-hub-secondary-link" href="${focus.secondaryHref}">${focus.secondaryText}</a>
        </div>
      </div>
    `

    recentPosts.prepend(hub)
  }

  const renderRagentSeriesNav = posts => {
    const articleTitle = document.querySelector('.post-title')?.textContent?.trim()
    const articleContainer = document.querySelector('#article-container')
    if (!articleTitle || !articleContainer) return
    if (!articleTitle.startsWith('Ragent学习笔记')) return
    if (document.querySelector('#ragent-series-nav')) return

    const series = posts
      .filter(post => post.title.startsWith('Ragent学习笔记'))
      .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
      .sort((a, b) => parseRagentOrder(a.title) - parseRagentOrder(b.title))

    const currentIndex = series.findIndex(post => post.title === articleTitle)
    if (currentIndex === -1) return

    const prev = currentIndex > 0 ? series[currentIndex - 1] : null
    const next = currentIndex < series.length - 1 ? series[currentIndex + 1] : null

    const seriesNav = document.createElement('section')
    seriesNav.id = 'ragent-series-nav'
    seriesNav.className = 'ragent-series-nav'
    seriesNav.innerHTML = `
      <div class="ragent-series-nav-head">
        <div>
          <span class="ragent-series-nav-eyebrow">系列导航</span>
          <h3>Ragent 学习路线</h3>
        </div>
        <a href="/blog/categories/ragent/">查看全部笔记</a>
      </div>
      <div class="ragent-series-nav-grid">
        <div class="ragent-series-nav-card ${prev ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">上一节</span>
          ${prev ? `<a href="${prev.url}">${escapeHtml(prev.title)}</a>` : '<span>已经是第一篇</span>'}
        </div>
        <div class="ragent-series-nav-card ragent-series-current">
          <span class="ragent-series-nav-label">当前</span>
          <strong>${escapeHtml(articleTitle)}</strong>
        </div>
        <div class="ragent-series-nav-card ${next ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">下一节</span>
          ${next ? `<a href="${next.url}">${escapeHtml(next.title)}</a>` : '<span>后续继续更新</span>'}
        </div>
      </div>
    `

    articleContainer.insertAdjacentElement('afterend', seriesNav)
  }

  const renderHot100SeriesNav = posts => {
    const articleTitle = document.querySelector('.post-title')?.textContent?.trim()
    const articleContainer = document.querySelector('#article-container')
    if (!articleTitle || !articleContainer) return
    if (!articleTitle.startsWith('Hot100：')) return
    if (document.querySelector('#hot100-series-nav')) return

    const series = posts
      .filter(post => post.title.startsWith('Hot100：'))
      .sort((a, b) => {
        if (a.dateValue !== b.dateValue) return a.dateValue - b.dateValue
        const byNumber = parseHot100Order(a.title) - parseHot100Order(b.title)
        if (byNumber !== 0) return byNumber
        return a.title.localeCompare(b.title, 'zh-Hans-CN')
      })

    const currentIndex = series.findIndex(post => post.title === articleTitle)
    if (currentIndex === -1) return

    const prev = currentIndex > 0 ? series[currentIndex - 1] : null
    const next = currentIndex < series.length - 1 ? series[currentIndex + 1] : null

    const seriesNav = document.createElement('section')
    seriesNav.id = 'hot100-series-nav'
    seriesNav.className = 'series-nav-block hot100-series-nav'
    seriesNav.innerHTML = `
      <div class="ragent-series-nav-head">
        <div>
          <span class="ragent-series-nav-eyebrow">题目导航</span>
          <h3>Hot100 复习路线</h3>
        </div>
        <a href="/blog/tags/Hot100/">查看全部题目</a>
      </div>
      <div class="ragent-series-nav-grid">
        <div class="ragent-series-nav-card ${prev ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">上一题</span>
          ${prev ? `<a href="${prev.url}">${escapeHtml(prev.title)}</a>` : '<span>已经是当前专题起点</span>'}
        </div>
        <div class="ragent-series-nav-card ragent-series-current">
          <span class="ragent-series-nav-label">当前</span>
          <strong>${escapeHtml(articleTitle)}</strong>
        </div>
        <div class="ragent-series-nav-card ${next ? '' : 'is-disabled'}">
          <span class="ragent-series-nav-label">下一题</span>
          ${next ? `<a href="${next.url}">${escapeHtml(next.title)}</a>` : '<span>后续继续补题</span>'}
        </div>
      </div>
    `

    articleContainer.insertAdjacentElement('afterend', seriesNav)
  }

  const boot = async () => {
    const posts = await loadPosts()
    renderHomeHub(posts)
    renderRagentSeriesNav(posts)
    renderHot100SeriesNav(posts)
  }

  document.addEventListener('DOMContentLoaded', boot)

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', boot, 'learningHubBoot')
  }
})()
