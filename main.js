// Constructor function
function Validator(options) {

    function getParent(inputElement, selector) {
        while (inputElement.parentElement) {
            if (inputElement.parentElement.matches(selector)) {
                return inputElement.parentElement;
            }
            inputElement = inputElement.parentElement
        }
    }

    var selectorRules = {}

    // validate function
    function validate(inputElement, rule) {
        var errorMessage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)

        // Get selector rules
        var rules = selectorRules[rule.selector];

        // Loop rules and check, stop when detect an error
        for (var i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked ')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }

        return !errorMessage; // Convert to boolean
    }

    // get elements of form
    var formElement = document.querySelector(options.form)

    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();

            var isFormValid = true

            // Loop rules and validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false
                }
            });

            if (isFormValid) {
                //Submit by javascript
                if (typeof options.onSubmit === 'function') {
                    var formEnableInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(formEnableInputs).reduce(function (values, input) {

                        switch (input.type) {
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                } 

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="'+input.name+'"]:checked').value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value
                        }

                        return values;
                    }, {})
                    options.onSubmit(formValues)
                }
                //Submit by default
                else {
                    formElement.submit();
                }
            }
        }


        // Loop and handle events
        options.rules.forEach(function (rule) {

            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.check)
            } else {
                selectorRules[rule.selector] = [rule.check]
            }

            var inputElements = formElement.querySelectorAll(rule.selector)
            //querySelectorAll return Nodelist --> Cant use forEach --> use Array.from() to convert

            Array.from(inputElements).forEach(function (inputElement) {
                if (inputElement) {
                    // blur out of input
                    inputElement.onblur = function () {
                        validate(inputElement, rule);
                    }
                    //text change while user enters to input
                    inputElement.oninput = function () {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                        errorElement.innerText = ''
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                    }
                }
            })

        })
    }
}


// Rules definition
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        check: function (value) {
            return value ? undefined : `${message}` || 'Please input here!'
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        check: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : `${message}` || 'This position must be email!'
        }
    }
}

Validator.minLength = function (selector, min) {
    return {
        selector: selector,
        check: function (value) {
            return value.length >= min ? undefined : `Please input ${min} characters at least!`
        }
    }
}


Validator.isConfirmed = function (selector, getConfirmedValue, message) {
    return {
        selector: selector,
        check: function (value) {
            return value === getConfirmedValue() ? undefined : `${message}` || 'Wrong value!'
        }
    }
}