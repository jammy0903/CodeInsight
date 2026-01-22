# JDK 17 Installation Guide for Debian/Ubuntu Linux

This guide provides steps to install OpenJDK 17 on Debian/Ubuntu based Linux systems. This is necessary for compiling Java code, such as the Java Debugger Agent.

## Steps to Install JDK 17 (Run in your terminal)

#### Step 1: Update Package List
First, ensure your system's package list is up-to-date.
```bash
sudo apt update
```
*(This command refreshes the list of available packages. `sudo` is used because it requires administrator privileges.)*

#### Step 2: Install OpenJDK 17
Install the OpenJDK 17 Development Kit.
```bash
sudo apt install openjdk-17-jdk
```
*(During the installation, you might be prompted to confirm disk space usage with `[Y/n]`. Type `Y` and press Enter to proceed.)*

#### Step 3: Verify Installation
After the installation is complete, verify that `javac` is correctly recognized and accessible.
```bash
javac -version
```
If the installation was successful, executing the command above should output version information similar to `javac 17.0.x`.

---

Once these steps are completed and you have verified the `javac` installation, you can proceed with building Java-based projects.
