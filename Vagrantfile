Vagrant.configure("2") do |config|
  config.vm.boot_timeout = 600
  config.vm.box = "bento/ubuntu-22.04"
  config.vm.hostname = "dev-vm"
  
  # Expor as portas de cada aplicação. (Altere o campo host caso alguma dessas portas esteja ocupada na sua máquina)
  # API Judge0
  config.vm.network "forwarded_port", guest: 2358, host: 2358
  # Banco de Dados da API Judge0 e Backend
  config.vm.network "forwarded_port", guest: 5432, host: 5433 
  # Backend Laravel
  config.vm.network "forwarded_port", guest: 8000, host: 8000
  # Frontend React
  config.vm.network "forwarded_port", guest: 5173, host: 5173
  
  # Recursos da máquina. São ajustáveis.
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--memory", "4096"]
    vb.cpus = 4
    vb.name = "ambiente-ifcodes-ubuntu22"
    # vb.gui = true
  end
  
  # Sincroniza a pasta do projeto para /vagrant na VM
  config.vm.synced_folder ".", "/vagrant"


  config.vm.provision "shell", inline: <<-'SHELL'
    echo "=== Iniciando provisionamento da VM ==="
    
    # Atualizar sistema
    apt-get update
    apt-get upgrade -y
    
    # Instalar dependências básicas
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        wget \
        unzip
    
    # Instalar Docker
    echo "Instalando Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Instalar Docker Compose V2
    echo "Instalando Docker Compose..."
    apt-get install -y docker-compose-plugin
    
    # Instalar QEMU para emulação x86 em ARM64 (necessário para Judge0 em ARM64)
    ARCH=$(dpkg --print-architecture)
    if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
      echo "Arquitetura ARM64 detectada. Instalando QEMU para emular x86..."
      apt-get install -y qemu-user-static binfmt-support
      update-binfmts --enable qemu-x86_64
      echo "✓ QEMU x86_64 configurado para emulação"
    fi

    # Configurar GRUB para cgroups v1 (necessário para Judge0)
    echo "Configurando GRUB para cgroups v1..."
    if ! grep -q "systemd.unified_cgroup_hierarchy=0" /etc/default/grub; then
      cp /etc/default/grub /etc/default/grub.backup 2>/dev/null || true
      cat <<'PY' >/tmp/update_grub.py
import pathlib

param = "systemd.unified_cgroup_hierarchy=0"
path = pathlib.Path("/etc/default/grub")
lines = path.read_text().splitlines()

def add_param(line):
    if "=" not in line:
        return line
    key, value = line.split("=", 1)
    value = value.strip()
    if not (value.startswith('"') and value.endswith('"')):
        return line
    current = [part for part in value[1:-1].strip().split() if part]
    if param not in current:
        current.append(param)
    return '{}="{}"'.format(key, " ".join(current))

with open(path, "w", encoding="utf-8") as handle:
    for original in lines:
        if original.startswith("GRUB_CMDLINE_LINUX_DEFAULT=") or original.startswith("GRUB_CMDLINE_LINUX="):
            handle.write(add_param(original))
        else:
            handle.write(original)
        handle.write("\n")
PY
      python3 /tmp/update_grub.py
      rm -f /tmp/update_grub.py
    fi
    
    update-grub
    
    if grep -q "systemd.unified_cgroup_hierarchy=0" /etc/default/grub; then
      echo "✓ Parâmetro cgroups v1 configurado com sucesso!"
    else
      echo "⚠ Aviso: Parâmetro pode já estar presente ou houve erro"
    fi
    
    # Adicionar usuário vagrant ao grupo docker
    usermod -aG docker vagrant

    # Gerar senhas redis e postgres do judge0
    REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    echo "Redis Password: $REDIS_PASS" > /vagrant/passwords.txt
    echo "PostgreSQL Password: $POSTGRES_PASS" >> /vagrant/passwords.txt
    chown vagrant:vagrant /vagrant/passwords.txt
    
    # Atualizar configurações no judge0.conf
    cd /vagrant
    sed -i "s#REDIS_PASSWORD=.*#REDIS_PASSWORD=$REDIS_PASS#" judge0.conf
    sed -i "s#POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=$POSTGRES_PASS#" judge0.conf
    
    echo "=== PROVISIONAMENTO COMPLETO ==="
    echo "Por favor, reinicie a VM com 'vagrant reload' para aplicar as configurações do GRUB."
    echo "Após o reload, acesse com 'vagrant ssh' e execute 'cd /vagrant && docker compose up -d' para iniciar os serviços."
  SHELL
end