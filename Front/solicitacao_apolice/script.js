const assetType = document.getElementById("assetType");
const dynamicFields = document.getElementById("dynamicFields");
const policyForm = document.getElementById("policyForm");

const documentInput = document.getElementById("document");
const phoneInput = document.getElementById("phone");
const assetValueInput = document.getElementById("assetValue");
const assetValueField = document.getElementById("assetValueField");
const startDateInput = document.getElementById("startDate");
const notesInput = document.getElementById("notes");
const charCount = document.getElementById("charCount");

const toast = document.getElementById("toast");
const closeToast = document.getElementById("closeToast");

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const dynamicTemplates = {
    veiculo: `
        <div class="field">
            <label for="vehiclePlate">Placa do veículo</label>
            <div class="control">
                <i class="fa-solid fa-car field-icon"></i>
                <input id="vehiclePlate" name="vehiclePlate" type="text" maxlength="8" placeholder="ABC1D23">
            </div>
            <span class="error-message"></span>
        </div>

        <div class="field">
            <label for="vehicleYear">Ano do veículo</label>
            <div class="control">
                <i class="fa-regular fa-calendar field-icon"></i>
                <input id="vehicleYear" name="vehicleYear" type="number" min="1900" max="2100" placeholder="2026">
            </div>
            <span class="error-message"></span>
        </div>
    `,

    imovel: `
        <div class="field">
            <label for="propertyType">Tipo de imóvel</label>
            <div class="control">
                <i class="fa-solid fa-building field-icon"></i>
                <select id="propertyType" name="propertyType">
                    <option value="" selected disabled>Selecione</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="comercial">Imóvel comercial</option>
                    <option value="rural">Imóvel rural</option>
                </select>
            </div>
            <span class="error-message"></span>
        </div>

        <div class="field">
            <label for="propertyCity">Cidade do imóvel</label>
            <div class="control">
                <i class="fa-solid fa-location-dot field-icon"></i>
                <input id="propertyCity" name="propertyCity" type="text" placeholder="Cidade / UF">
            </div>
            <span class="error-message"></span>
        </div>
    `,

    eletronico: `
        <div class="field">
            <label for="deviceType">Tipo de eletrônico</label>
            <div class="control">
                <i class="fa-solid fa-laptop field-icon"></i>
                <input id="deviceType" name="deviceType" type="text" placeholder="Ex.: Notebook, celular, câmera">
            </div>
            <span class="error-message"></span>
        </div>

        <div class="field">
            <label for="deviceModel">Marca / Modelo</label>
            <div class="control">
                <i class="fa-solid fa-tag field-icon"></i>
                <input id="deviceModel" name="deviceModel" type="text" placeholder="Ex.: Samsung Galaxy S26">
            </div>
            <span class="error-message"></span>
        </div>
    `,

    maquinario: `
        <div class="field">
            <label for="machineType">Tipo de maquinário</label>
            <div class="control">
                <i class="fa-solid fa-gears field-icon"></i>
                <input id="machineType" name="machineType" type="text" placeholder="Ex.: Trator, empilhadeira">
            </div>
            <span class="error-message"></span>
        </div>

        <div class="field">
            <label for="machineYear">Ano de fabricação</label>
            <div class="control">
                <i class="fa-regular fa-calendar field-icon"></i>
                <input id="machineYear" name="machineYear" type="number" min="1900" max="2100" placeholder="2024">
            </div>
            <span class="error-message"></span>
        </div>
    `,

    vida: `
        <div class="field">
            <label for="birthDate">Data de nascimento</label>
            <select id="assetType" name="assetType" required>
                                    <option value="" selected disabled>Selecione o tipo de seguro</option>
                                    <option value="individual">Seguro individual</option>
                                    <option value="grupo">Seguro em grupo</option>
                                    
                                </select>
            <span class="error-message"></span>
        </div>
    `
};

/* =========================
   MENU MOBILE
========================= */

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    menuToggle.classList.toggle("active");
});

/* =========================
   TIPO DE BEM / SEGURO
========================= */

assetType.addEventListener("change", () => {
    const selected = assetType.value;

    dynamicFields.innerHTML = dynamicTemplates[selected] || "";

    const isVida = selected === "vida";
    assetValueInput.required = !isVida;

    if (isVida) {
        assetValueInput.value = "";
        clearFieldError(assetValueInput);
        hideAssetValueField();
    } else {
        showAssetValueField();
    }

    clearFieldError(assetType);
});

function hideAssetValueField() {
    assetValueField.classList.add("field-hidden");
    assetValueField.addEventListener("transitionend", () => {
        if (assetValueField.classList.contains("field-hidden")) {
            assetValueField.style.display = "none";
        }
    }, { once: true });
}

function showAssetValueField() {
    assetValueField.style.display = "";
    void assetValueField.offsetWidth; // força reflow para a transição disparar
    assetValueField.classList.remove("field-hidden");
}

/* =========================
   MÁSCARAS
========================= */

documentInput.addEventListener("input", () => {
    let value = documentInput.value.replace(/\D/g, "").slice(0, 14);

    if (value.length <= 11) {
        value = value
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    } else {
        value = value
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    documentInput.value = value;
});

phoneInput.addEventListener("input", () => {
    let value = phoneInput.value.replace(/\D/g, "").slice(0, 11);

    if (value.length <= 10) {
        value = value
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
        value = value
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    phoneInput.value = value;
});

assetValueInput.addEventListener("input", formatCurrencyInput);

function formatCurrencyInput(event) {
    const input = event.target;
    const digits = input.value.replace(/\D/g, "");

    if (!digits) {
        input.value = "";
        return;
    }

    const value = Number(digits) / 100;

    input.value = value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* =========================
   DATA MÍNIMA = HOJE
========================= */

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

startDateInput.min = localToday;

/* =========================
   CONTADOR DE OBSERVAÇÕES
========================= */

notesInput.addEventListener("input", () => {
    charCount.textContent = notesInput.value.length;
});

/* =========================
   VALIDAÇÃO
========================= */

function setFieldError(input, message) {
    const field = input.closest(".field");

    if (!field) return;

    field.classList.add("invalid");

    const error = field.querySelector(".error-message");
    if (error) {
        error.textContent = message;
    }
}

function clearFieldError(input) {
    const field = input.closest(".field");

    if (!field) return;

    field.classList.remove("invalid");

    const error = field.querySelector(".error-message");
    if (error) {
        error.textContent = "";
    }
}

function validateRequired(input, message = "Este campo é obrigatório.") {
    if (!input.value.trim()) {
        setFieldError(input, message);
        return false;
    }

    clearFieldError(input);
    return true;
}

function validateEmail() {
    const email = document.getElementById("email");
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email.value.trim())) {
        setFieldError(email, "Digite um e-mail válido.");
        return false;
    }

    clearFieldError(email);
    return true;
}

function validateDocument() {
    const digits = documentInput.value.replace(/\D/g, "");

    if (digits.length !== 11 && digits.length !== 14) {
        setFieldError(documentInput, "Digite um CPF ou CNPJ válido.");
        return false;
    }

    clearFieldError(documentInput);
    return true;
}

function validatePhone() {
    const digits = phoneInput.value.replace(/\D/g, "");

    if (digits.length < 10) {
        setFieldError(phoneInput, "Digite um telefone válido.");
        return false;
    }

    clearFieldError(phoneInput);
    return true;
}

[
    assetType,
    document.getElementById("fullName"),
    document.getElementById("email"),
    documentInput,
    phoneInput,
    assetValueInput,
    startDateInput
].forEach(input => {
    input.addEventListener("change", () => clearFieldError(input));
});

/* =========================
   SUBMIT
========================= */

policyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");

    let valid = true;

    valid = validateRequired(assetType, "Selecione o tipo de bem.") && valid;
    valid = validateRequired(fullName, "Informe seu nome ou razão social.") && valid;
    valid = validateDocument() && valid;
    valid = validateEmail() && valid;
    valid = validatePhone() && valid;
    if (assetType.value !== "vida") {
        valid = validateRequired(assetValueInput, "Informe o valor estimado.") && valid;
    }
    valid = validateRequired(startDateInput, "Informe a data de início.") && valid;

    if (!valid) {
        document.querySelector(".field.invalid")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        return;
    }

    const submitButton = policyForm.querySelector(".submit-button");
    const originalContent = submitButton.innerHTML;

    submitButton.classList.add("loading");
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Enviando...</span>
    `;

    const formData = Object.fromEntries(new FormData(policyForm).entries());

    /*
      Aqui você pode integrar com a sua API PHP.

      Exemplo:

      const response = await fetch("https://sua-api.com/apolices/solicitacoes", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
      });

      if (!response.ok) {
          throw new Error("Erro ao enviar solicitação");
      }
    */

    try {
        // Simulação do envio
        await new Promise(resolve => setTimeout(resolve, 900));

        console.log("Dados da solicitação:", formData);

        showToast();

        policyForm.reset();
        dynamicFields.innerHTML = "";
        charCount.textContent = "0";
        showAssetValueField();
        assetValueInput.required = true;

    } catch (error) {
        console.error(error);
        alert("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
        submitButton.innerHTML = originalContent;
    }
});

/* =========================
   TOAST
========================= */

let toastTimer;

function showToast() {
    clearTimeout(toastTimer);
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4500);
}

closeToast.addEventListener("click", () => {
    toast.classList.remove("show");
});
