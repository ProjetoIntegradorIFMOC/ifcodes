Vagrant.configure("2") do |config|
  config.vm.boot_timeout = 600
  config.vm.box = "ubuntu/jammy64"
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
    vb.customize ["modifyvm", :id, "--memory", "2048"]
    vb.cpus = 4
    vb.name = "ambiente-ifcodes-ubuntu22t"
    # vb.gui = true
  end
  
  # Sincroniza a pasta do projeto para /vagrant na VM
  config.vm.synced_folder ".", "/vagrant"


  config.vm.provision "shell", inline: <<-SHELL
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

    # Configurar GRUB (necessário para Judge0)
    echo "Configurando GRUB..."
    cp /etc/default/grub /etc/default/grub.backup
    sed -i 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"/' /etc/default/grub
    update-grub
    
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
