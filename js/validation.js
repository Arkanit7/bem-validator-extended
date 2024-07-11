const ERROR_CODES = {
  NO_PARENT_BLOCK: 'NO_PARENT_BLOCK',
  RECURSIVE_ELEMENT: 'RECURSIVE_ELEMENT',
  ONLY_MODIFIER: 'ONLY_MODIFIER',
  RECURSIVE_BLOCK: 'RECURSIVE_BLOCK',
  ELEMENT_OF_ELEMENT: 'ELEMENT_OF_ELEMENT',
  MORE_THAN_ONE_BLOCK: 'MORE_THAN_ONE_BLOCK',
  MORE_THAN_ONE_ELEMENT: 'MORE_THAN_ONE_ELEMENT',
  HIERARCHY: 'HIERARCHY',
  ONLY_CLOSEST_PARENT: 'ONLY_CLOSEST_PARENT',
}

const ERROR_TRANSLATION = {
  uk: {
    [ERROR_CODES.ELEMENT_OF_ELEMENT]: 'Подвійний елемент',
    [ERROR_CODES.RECURSIVE_BLOCK]: 'Блок знаходиться в блоці з тим же іменем',
    [ERROR_CODES.RECURSIVE_ELEMENT]:
      'Елемент знаходиться в елементі з тим же іменем',
    [ERROR_CODES.NO_PARENT_BLOCK]:
      'БЕМ-елемент не може знаходитись за межами свого БЕМ-блоку',
    [ERROR_CODES.ONLY_MODIFIER]:
      'Модифікатор використовується без блока обо елемента',
    [ERROR_CODES.MORE_THAN_ONE_BLOCK]:
      'Вузол не може бути одночасно двома БЕМ-блоками',
    [ERROR_CODES.MORE_THAN_ONE_ELEMENT]:
      'Вузол не може бути одночасно двома БЕМ-елементами',
    [ERROR_CODES.HIERARCHY]:
      'При формуванні імені класу не має прослідковуватися ієрархія',
    [ERROR_CODES.ONLY_CLOSEST_PARENT]:
      'БЕМ-елемент не є елементом найближчого батьківського БЕМ-блоку',
  },
  en: {
    [ERROR_CODES.ELEMENT_OF_ELEMENT]: 'Double element',
    [ERROR_CODES.RECURSIVE_BLOCK]: 'Block is in block with same name',
    [ERROR_CODES.RECURSIVE_ELEMENT]: 'Element is in element with same name',
    [ERROR_CODES.NO_PARENT_BLOCK]: 'Element was used without block as parent',
    [ERROR_CODES.ONLY_MODIFIER]: 'Modifier was used without block or element',
    [ERROR_CODES.MORE_THAN_ONE_BLOCK]:
      'The node cannot have two BEM blocks at the same time',
    [ERROR_CODES.MORE_THAN_ONE_ELEMENT]:
      'The node cannot have two BEM elements at the same time',
    [ERROR_CODES.HIERARCHY]:
      'When forming a class name, the hierarchy should not be traced',
    [ERROR_CODES.ONLY_CLOSEST_PARENT]:
      'The BEM element is not an element of the nearest parent BEM block',
  },
}

const IGNORE_CLASSES = [
  'swiper',
  'swiper-wrapper',
  'swiper-slide',
  'swiper-pagination',
  'swiper-navigation',
  'swiper-button-prev',
  'swiper-button-next',
  'swiper-scrollbar',
]

function getParentPathWithHighlight(parentArray, errorClass) {
  const filteredArray = parentArray.filter((array) => array.length > 0)
  const mappedArray = filteredArray.map((array) => array.join('.'))
  const joinedArray = `.${mappedArray.join(' > .')}`

  // Find the last occurrence of the errorClass in the parent path
  const lastIndex = joinedArray.lastIndexOf(`.${errorClass.split('__')[0]}`)
  const highlightedPath = `${joinedArray.slice(0, lastIndex)}<span class="correct">${joinedArray.slice(lastIndex, joinedArray.indexOf('>', lastIndex) + 1)}</span>${joinedArray.slice(joinedArray.indexOf('>', lastIndex) + 1)}`

  return highlightedPath
}

function parseClassName(className) {
  const regExp =
    /(?:^|\s)([a-z0-9]+(?:-[a-z0-9]+)*)(?:__([a-z0-9]+(?:-[a-z0-9]+)*))?(?:--([a-z0-9]+(?:-[a-z0-9]+)*))?(?:--([a-z0-9]+(?:-[a-z0-9]+)*))?/i

  const [, blockName, elementName, modifierName, modifierValue] =
    regExp.exec(className)

  return { blockName, elementName, modifierName, modifierValue }
}

function getBemType(className) {
  const { elementName, modifierName } = parseClassName(className)

  if (modifierName) return 'MODIFIER'
  if (elementName) return 'ELEMENT'
  return 'BLOCK'
}

function testElementForClosestParent(blockName, parentArray = []) {
  for (let i = parentArray.length - 1; i >= 0; i -= 1) {
    // If we found parent, then we're done here.
    if (parentArray[i].some((parentClass) => parentClass === blockName)) break

    // If the parent is block, then it's not the right one!
    if (
      parentArray[i].some((parentClass) => getBemType(parentClass) === 'BLOCK')
    )
      return true
  }
  return false
}

function validateNode(node, parentArray = []) {
  const errors = []
  const children = [...node.children]
  const currentClasses = [...node.classList].filter(
    (className) => !IGNORE_CLASSES.includes(className),
  )

  currentClasses.forEach((className) => {
    const { blockName, elementName, modifierName } = parseClassName(className)
    const type = getBemType(className)

    if (
      elementName &&
      !parentArray.flat().find((parentClass) => parentClass === blockName)
    ) {
      errors.push({
        code: ERROR_CODES.NO_PARENT_BLOCK,
        className,
        parentArray,
      })
    }

    if (
      elementName &&
      parentArray
        .flat()
        .find((parentClass) => parentClass === `${blockName}__${elementName}`)
    ) {
      errors.push({
        code: ERROR_CODES.RECURSIVE_ELEMENT,
        className,
        parentArray,
      })
    }

    if (
      modifierName &&
      !currentClasses.find((currentClass) =>
        elementName
          ? currentClass === `${blockName}__${elementName}`
          : blockName === currentClass,
      )
    ) {
      errors.push({
        code: ERROR_CODES.ONLY_MODIFIER,
        className,
        parentArray,
      })
    }

    if (
      type === 'BLOCK' &&
      parentArray.flat().some((parentClass) => parentClass === blockName)
    ) {
      errors.push({
        code: ERROR_CODES.RECURSIVE_BLOCK,
        className,
        parentArray,
      })
    }

    if (className.split('__').length > 2) {
      errors.push({
        code: ERROR_CODES.ELEMENT_OF_ELEMENT,
        className,
        parentArray,
      })
    }

    // MORE_THAN_ONE_BLOCK
    // if (
    //   type === 'BLOCK' &&
    //   currentClasses.filter((currentClass) => {
    //     const parentType = getBemType(currentClass)
    //     return parentType === 'BLOCK'
    //   }).length > 1
    // ) {
    //   errors.push({
    //     code: ERROR_CODES.MORE_THAN_ONE_BLOCK,
    //     className,
    //     parentArray,
    //   })
    // }

    // MORE_THAN_ONE_ELEMENT
    // if (
    //   type === 'ELEMENT' &&
    //   currentClasses.filter((currentClass) => {
    //     const parentType = getBemType(currentClass)
    //     return parentType === 'ELEMENT'
    //   }).length > 1
    // ) {
    //   errors.push({
    //     code: ERROR_CODES.MORE_THAN_ONE_ELEMENT,
    //     className,
    //     parentArray,
    //   })
    // }

    // HIERARCHY
    if (
      type === 'BLOCK' &&
      parentArray
        .flat()
        .some((parentClass) => blockName.startsWith(`${parentClass}-`))
    ) {
      errors.push({
        code: ERROR_CODES.HIERARCHY,
        className,
        parentArray,
      })
    }

    if (
      type === 'ELEMENT' &&
      parentArray.flat().some((parentClass) => {
        if (getBemType(parentClass) !== 'ELEMENT') return false
        return className.startsWith(`${parentClass}-`)
      })
    ) {
      errors.push({
        code: ERROR_CODES.HIERARCHY,
        className,
        parentArray,
      })
    }

    // ONLY_CLOSEST_PARENT
    if (
      type === 'ELEMENT' &&
      testElementForClosestParent(blockName, parentArray)
    ) {
      errors.push({
        code: ERROR_CODES.ONLY_CLOSEST_PARENT,
        className,
        parentArray,
      })
    }
  })

  children?.forEach((child) => {
    const childErrors = validateNode(child, [...parentArray, currentClasses])
    errors.push(...childErrors)
  })

  return errors
}

function insertErrors(errors, emptyInput = false) {
  const result = document.querySelector('[data-validate-result]')

  if (emptyInput) {
    result.classList.remove('errors', 'no-errors')
    result.classList.add('errors')
    result.innerHTML =
      '<h2 class="result__title">Вставте код в поле для валідації</h2>'
    return
  }

  if (errors.length === 0) {
    result.classList.remove('errors', 'no-errors')
    result.classList.add('no-errors')
    result.innerHTML =
      '<h2 class="result__title">Відмінно, помилки відсутні 😎</h2>'
    return
  }

  result.classList.remove('errors', 'no-errors')
  result.classList.add('errors')

  let output = ''

  errors.forEach((error) => {
    output += `<li class="result__item item-result">
      <p class="item-result__label">
        ${ERROR_TRANSLATION.uk[error.code]}
      </p>
      <p class="item-result__desc">
        <code>
          ${getParentPathWithHighlight(error.parentArray, error.className)} >
          <span>.${error.className}</span>
        </code>
      </p>
    </li>`
  })

  result.innerHTML = `
    <h2 class="result__title">Упс знайдено помилки 🧐</h2>
    <ul class="result__list">
      ${output}
    </ul>
  `
}

function validate() {
  const textarea = document.querySelector('[data-validate-input]')
  const input = textarea.value.trim() // Видаляємо пробіли з початку і кінця

  if (input === '') {
    insertErrors([], true)
    return
  }

  const parser = new DOMParser()
  const { documentElement } = parser.parseFromString(input, 'text/html')
  const errors = validateNode(documentElement)

  insertErrors(errors)
}

function initialize() {
  const validateButton = document.querySelector('[data-validate-submit]')

  validateButton.addEventListener('click', validate)
}

initialize()
