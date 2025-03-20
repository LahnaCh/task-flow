const todoInput = document.getElementById("todo-input");
const errorInput = document.getElementById("error-input");

export const validateDescription = () => {
    if (todoInput.validity.valid) {
        errorInput.innerText = "";
        return true;
    } else {
        if (todoInput.validity.valueMissing) {
            errorInput.innerText = "Champ obligatoire";
            return false;
        } else {
            if (todoInput.validity.tooShort) {
                errorInput.innerText =
                    "La description doit contenir au moins 5 caractères";
                return false;
            }
        }
    }
};
