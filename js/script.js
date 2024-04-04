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
      'елемент знаходиться в елементі з тим же іменем',
    [ERROR_CODES.NO_PARENT_BLOCK]: 'Елемент немає батька',
    [ERROR_CODES.ONLY_MODIFIER]:
      'Модифікатор використовується без блока обо елемента',
    [ERROR_CODES.MORE_THAN_ONE_BLOCK]:
      "Об'єкт не може бути одночасно двома BEM-блоками",
    [ERROR_CODES.MORE_THAN_ONE_ELEMENT]:
      "Об'єкт не може бути одночасно двома BEM-елементами",
    [ERROR_CODES.HIERARCHY]:
      'При формуванні імені класу не має бути спроби ієрархії',
    [ERROR_CODES.ONLY_CLOSEST_PARENT]:
      'Елемент має бути елементом лише найближчого блоку',
  },
  en: {
    [ERROR_CODES.ELEMENT_OF_ELEMENT]: 'It could not be element of element',
    [ERROR_CODES.RECURSIVE_BLOCK]: 'Block is in block with same name',
    [ERROR_CODES.RECURSIVE_ELEMENT]: 'Element is in element with same name',
    [ERROR_CODES.NO_PARENT_BLOCK]: 'Element was used without block as parent',
    [ERROR_CODES.ONLY_MODIFIER]: 'Modifier was used without block or element',
    [ERROR_CODES.MORE_THAN_ONE_BLOCK]:
      "Об'єкт не може бути одночасно двома BEM-блоками",
    [ERROR_CODES.MORE_THAN_ONE_ELEMENT]:
      "Об'єкт не може бути одночасно двома BEM-елементами",
    [ERROR_CODES.HIERARCHY]:
      'При формуванні імені класу не має бути спроби ієрархії',
    [ERROR_CODES.ONLY_CLOSEST_PARENT]:
      'Елемент має бути елементом лише найближчого блоку',
  },
}

function parseClassName(className) {
  const regExp =
    /(?:^|\s)([a-z]+(?:-[a-z]+)*)(?:__([a-z]+(?:-[a-z]+)*))?(?:--([a-z]+(?:-[a-z]+)*))?(?:--([a-z]+(?:-[a-z]+)*))?/i

  const [, blockName, elementName, modifierName, modifierValue] =
    regExp.exec(className)

  return { blockName, elementName, modifierName, modifierValue }
}

function getBemType(className) {
  const { blockName, elementName, modifierName, modifierValue } =
    parseClassName(className)
  if (blockName && !elementName && !modifierName) return 'BLOCK'
  if (blockName && elementName && !modifierName) return 'ELEMENT'
  return 'MODIFIER'
}

function testElementForClosestParent(blockName, parentArray = []) {
  for (let i = parentArray.length - 1; i >= 0; i--) {
    const parentType = getBemType(parentArray[i])
    if (parentType === 'BLOCK') {
      if (blockName === parseClassName(parentArray[i]).blockName) return false
      return true
    }
  }
}

function testElementForHierarchy(elementName, parentArray = []) {
  for (let i = parentArray.length - 1; i >= 0; i--) {
    const parentType = getBemType(parentArray[i])

    if (parentType === 'BLOCK') break
    if (
      parentType === 'ELEMENT' &&
      elementName.startsWith(parseClassName(parentArray[i]).elementName)
    )
      return true
  }
  return false
}

function validateNode(node, parentArray = []) {
  const errors = []
  const children = [...node.children]
  const currentClasses = [...node.classList]

  currentClasses.forEach((className) => {
    const { blockName, elementName, modifierName, modifierValue } =
      parseClassName(className)
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
          : blockName === currentClass
      )
    ) {
      errors.push({
        code: ERROR_CODES.ONLY_MODIFIER,
        className,
        parentArray,
      })
    }

    if (
      !elementName &&
      !modifierName &&
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
    if (
      type === 'BLOCK' &&
      currentClasses.filter((currentClass) => {
        const parentType = getBemType(currentClass)
        return parentType === 'BLOCK'
      }).length > 1
    ) {
      errors.push({
        code: ERROR_CODES.MORE_THAN_ONE_BLOCK,
        className,
        parentArray,
      })
    }

    // MORE_THAN_ONE_ELEMENT
    if (
      type === 'ELEMENT' &&
      currentClasses.filter((currentClass) => {
        const parentType = getBemType(currentClass)
        return parentType === 'ELEMENT'
      }).length > 1
    ) {
      errors.push({
        code: ERROR_CODES.MORE_THAN_ONE_ELEMENT,
        className,
        parentArray,
      })
    }

    // HIERARCHY
    if (
      type === 'BLOCK' &&
      parentArray?.some((parentName) => blockName.startsWith(parentName))
    ) {
      errors.push({
        code: ERROR_CODES.HIERARCHY,
        className,
        parentArray,
      })
    }

    if (
      type === 'ELEMENT' &&
      testElementForHierarchy(elementName, parentArray)
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
    const childErrors = validateNode(child, [...parentArray, ...currentClasses])
    errors.push(...childErrors)
  })

  return errors
}

function insertErrors(errors) {
  const result = document.querySelector('[data-validate-result]')
  result.innerHTML = '<h2 class="result__title">Добре!</h2>'

  if (errors.length === 0) return

  let output = ''

  errors.forEach((error) => {
    const errorCode = error.code
    output += `<li class="result__item item-result">
		<p class="item-result__label">
		${ERROR_TRANSLATION.uk[errorCode]}
		</p>
		<p class="item-result__desc">
			<code>
				.${error.parentArray.join(' > .')} >
				<span>.${error.className}</span></code
			>
		</p>
	</li>`
  })

  result.innerHTML = `
	<h2 class="result__title">Помилки</h2>
	<ul class="result__list">
	${output}
	</ul>
	`
}

function validate() {
  const textarea = document.querySelector('[data-validate-input]')
  const input = textarea.value

  const parser = new DOMParser()
  const { body } = parser.parseFromString(input, 'text/html')

  const errors = validateNode(body, [])

  insertErrors(errors)
}

function initialize() {
  const validateButton = document.querySelector('[data-validate-submit]')

  validateButton.addEventListener('click', validate)
}

initialize()
